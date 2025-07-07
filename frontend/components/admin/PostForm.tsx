"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  Eye,
  /* Calendar, Clock, */ AlertCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PostDetailSimple } from "@/components/posts/PostDetail";
import { ButtonSpinner } from "@/components/common/LoadingSpinner";
import {
  postFormSchema,
  type PostFormInput,
} from "@/lib/validation/postSchema";
import type { Post, CreatePostData, UpdatePostData } from "@/types/post";
import { formatDate, stringUtils } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getUsers } from "@/lib/api";

interface PostFormProps {
  post?: Post | null;
  onSubmit: (
    data: CreatePostData | UpdatePostData,
  ) => Promise<{ success: boolean; error?: string }>;
  onSave?: (
    data: CreatePostData | UpdatePostData,
  ) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
  className?: string;
}

// 日付をdatetime-local用の文字列(YYYY-MM-DDTHH:mm)に変換する関数
function toDatetimeLocalString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PostForm({
  post,
  onSubmit,
  onSave,
  loading = false,
  className,
}: PostFormProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [users, setUsers] = useState<
    { id: number; name: string; email: string }[]
  >([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const isEditing = !!post;

  // ユーザー一覧を取得
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const usersData = await getUsers();
        setUsers(usersData || []);
      } catch (error) {
        console.error("ユーザー一覧の取得に失敗しました:", error);
        setUsers([]); // エラー時は空配列を設定
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // フォーム初期化
  const form = useForm<PostFormInput>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
      status: post?.status || "draft",
      published_at: post?.published_at ? new Date(post.published_at) : null,
      user_id: post?.user_id || null,
    },
  });

  const {
    watch,
    handleSubmit,
    formState: {
      /* errors, isDirty */
    },
  } = form;
  const watchedValues = watch();

  // 文字数カウント
  useEffect(() => {
    const content = watchedValues.content || "";
    const plainText = stringUtils.stripHtml(content);
    setCharCount(plainText.length);
    setWordCount(
      plainText.split(/\s+/).filter((word) => word.length > 0).length,
    );
  }, [watchedValues.content]);

  // 手動保存機能（自動保存を無効化）
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState(watchedValues);
  
  // 変更検知
  const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify(initialValues);
  
  // 手動保存機能
  const handleManualSave = async () => {
    if (!onSave || !isEditing || !hasChanges) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const formData = {
        ...watchedValues,
        published_at: watchedValues.published_at?.toISOString() || null,
      };

      const result = await onSave(formData as UpdatePostData);
      if (!result.success) {
        throw new Error(result.error || "保存に失敗しました");
      }
      
      setLastSaved(new Date());
      setInitialValues(watchedValues);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "保存に失敗しました";
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 初期値を設定（編集時）
  useEffect(() => {
    if (isEditing && post) {
      setInitialValues({
        title: post.title || "",
        content: post.content || "",
        excerpt: post.excerpt || "",
        status: post.status || "draft",
        published_at: post.published_at ? new Date(post.published_at) : null,
        user_id: post.user_id || null,
      });
    }
  }, [isEditing, post]);

  // フォーム送信
  const onFormSubmit = async (data: PostFormInput) => {
    setSubmitError(null);

    try {
      const formData = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || "",
        status: data.status,
        published_at: (() => {
          if (data.status === "draft") {
            return null;
          }
          if (data.status === "published") {
            return data.published_at?.toISOString() || new Date().toISOString();
          }
          if (data.status === "scheduled") {
            return data.published_at?.toISOString() || null;
          }
          return null;
        })(),
        user_id: data.user_id || null,
      };

      const result = isEditing
        ? await onSubmit({ ...formData, id: post!.id } as UpdatePostData)
        : await onSubmit(formData as CreatePostData);

      if (!result.success) {
        setSubmitError(result.error || "保存に失敗しました");
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました",
      );
    }
  };

  // プレビュー用の記事データ
  const previewPost: Post = {
    id: post?.id || 0,
    title: watchedValues.title || "タイトル未入力",
    content: watchedValues.content || "本文未入力",
    excerpt: watchedValues.excerpt || "",
    status: watchedValues.status || "draft",
    status_label: watchedValues.status === "published" ? "公開" : "下書き",
    published_at: watchedValues.published_at?.toISOString() || null,
    published_at_formatted: watchedValues.published_at
      ? formatDate.toJapaneseDateTime(watchedValues.published_at.toISOString())
      : null,
    is_published: watchedValues.status === "published",
    is_draft: watchedValues.status === "draft",
    created_at: post?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_at_formatted: formatDate.toJapanese(
      post?.created_at || new Date().toISOString(),
    ),
    updated_at_formatted: formatDate.toJapanese(new Date().toISOString()),
    meta: {
      title_length: watchedValues.title?.length || 0,
      content_length: charCount,
      excerpt_length: watchedValues.excerpt?.length || 0,
      reading_time_minutes: Math.max(1, Math.ceil(charCount / 400)),
    },
    author: post?.author || { id: 1, name: 'Admin User', email: 'admin@example.com' },
    user_id: post?.user_id || 1,
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "記事を編集" : "新しい記事を作成"}
          </h1>
          {isEditing && post && (
            <p className="text-sm text-gray-600 mt-1">
              作成日: {formatDate.toJapaneseDateTime(post.created_at)}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* プレビューボタン */}
          <Button
            type="button"
            variant={isPreviewMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? "フォームに戻る" : "プレビュー"}
          </Button>

          {/* 保存状態表示 */}
          {isEditing && onSave && (
            <div className="flex items-center text-sm text-gray-500">
              {isSaving && <ButtonSpinner />}
              {hasChanges && !isSaving && (
                <span className="text-orange-600">未保存の変更があります</span>
              )}
              {!hasChanges && !isSaving && lastSaved && (
                <span className="text-green-600">
                  {formatDate.toRelative(lastSaved.toISOString())}に保存済み
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {(submitError || saveError) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {submitError || saveError}
          </AlertDescription>
        </Alert>
      )}

      {/* プレビューモード */}
      {isPreviewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>プレビュー</CardTitle>
          </CardHeader>
          <CardContent>
            <PostDetailSimple post={previewPost} />
          </CardContent>
        </Card>
      ) : (
        /* フォームモード */
        <Form {...form}>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* メインコンテンツ */}
              <div className="lg:col-span-2 space-y-6">
                {/* タイトル */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タイトル</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="記事のタイトルを入力..."
                          {...field}
                          className="text-lg"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/255文字
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 抜粋 */}
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>抜粋（オプション）</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="記事の抜粋を入力..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        記事一覧で表示される要約文です。未入力の場合は本文から自動生成されます。
                        {field.value?.length || 0}/500文字
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 本文 */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>本文</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="記事の本文を入力..."
                          rows={20}
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        単語数: {wordCount.toLocaleString()}語
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* サイドバー */}
              <div className="space-y-6">
                {/* 公開設定 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">公開設定</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 作成者 */}
                    <FormField
                      control={form.control}
                      name="user_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            作成者
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(value ? Number(value) : null)
                            }
                            value={field.value?.toString() || ""}
                            disabled={usersLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    usersLoading
                                      ? "読み込み中..."
                                      : "作成者を選択"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users && users.length > 0 ? (
                                users.map((user) => (
                                  <SelectItem
                                    key={user.id}
                                    value={user.id.toString()}
                                  >
                                    {user.name} ({user.email})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-users" disabled>
                                  {usersLoading
                                    ? "読み込み中..."
                                    : "ユーザーが見つかりません"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            記事の作成者を選択してください。未選択の場合は現在のユーザーが設定されます。
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ステータス */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ステータス</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="ステータスを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">下書き</SelectItem>
                              <SelectItem value="published">即座に公開</SelectItem>
                              <SelectItem value="scheduled">予約投稿</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 公開日時（公開・予約投稿時のみ表示） */}
                    {(watchedValues.status === "published" || watchedValues.status === "scheduled") && (
                      <FormField
                        control={form.control}
                        name="published_at"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>公開日時</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                value={
                                  field.value
                                    ? toDatetimeLocalString(field.value)
                                    : ""
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value ? new Date(value) : null,
                                  );
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              {watchedValues.status === "published" 
                                ? "未設定の場合は現在時刻で公開されます" 
                                : "予約投稿の場合は公開日時の設定が必要です"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* ステータス表示 */}
                    <div className="pt-2">
                      <Badge
                        variant={
                          watchedValues.status === "published"
                            ? "default"
                            : watchedValues.status === "scheduled"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {watchedValues.status === "published"
                          ? "公開"
                          : watchedValues.status === "scheduled"
                          ? "予約投稿"
                          : "下書き"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 記事情報 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">記事情報</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">文字数:</span>
                      <span>{charCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">単語数:</span>
                      <span>{wordCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">読了時間:</span>
                      <span>約{Math.max(1, Math.ceil(charCount / 400))}分</span>
                    </div>
                    {isEditing && post && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-gray-600">作成日:</span>
                          <span>{formatDate.toJapanese(post.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">更新日:</span>
                          <span>{formatDate.toJapanese(post.updated_at)}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* フォーム送信ボタン */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="submit" disabled={loading} size="lg">
                {loading && <ButtonSpinner />}
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "更新" : "作成"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

/**
 * シンプルな記事フォーム（クイック作成用）
 */
interface QuickPostFormProps {
  onSubmit: (
    data: Pick<CreatePostData, "title" | "content" | "status">,
  ) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function QuickPostForm({
  onSubmit,
  loading = false,
  className,
}: QuickPostFormProps) {
  const form = useForm<Pick<PostFormInput, "title" | "content" | "status">>({
    resolver: zodResolver(
      postFormSchema.pick({ title: true, content: true, status: true }),
    ),
    defaultValues: {
      title: "",
      content: "",
      status: "draft",
    },
  });

  const onFormSubmit = async (
    data: Pick<PostFormInput, "title" | "content" | "status">,
  ) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>クイック投稿</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="タイトル" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="本文" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">下書き</SelectItem>
                        <SelectItem value="published">公開</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading}>
                {loading && <ButtonSpinner />}
                投稿
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
