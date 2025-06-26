<?php

namespace App\Http\Requests\Post;

use App\Models\Post;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // 認証されたユーザーのみ記事更新可能
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'max:255',
                'min:1',
            ],
            'content' => [
                'required',
                'string',
                'min:10',
            ],
            'excerpt' => [
                'nullable',
                'string',
                'max:500',
            ],
            'status' => [
                'required',
                'string',
                Rule::in([Post::STATUS_DRAFT, Post::STATUS_PUBLISHED]),
            ],
            'published_at' => [
                'nullable',
                'date',
                // 更新時は過去の日付も許可（既に公開された記事の場合）
                'before_or_equal:'.now()->addYears(1)->toDateString(),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'タイトルは必須です。',
            'title.string' => 'タイトルは文字列で入力してください。',
            'title.max' => 'タイトルは255文字以内で入力してください。',
            'title.min' => 'タイトルは1文字以上入力してください。',

            'content.required' => '本文は必須です。',
            'content.string' => '本文は文字列で入力してください。',
            'content.min' => '本文は10文字以上入力してください。',

            'excerpt.string' => '抜粋は文字列で入力してください。',
            'excerpt.max' => '抜粋は500文字以内で入力してください。',

            'status.required' => 'ステータスは必須です。',
            'status.string' => 'ステータスは文字列で入力してください。',
            'status.in' => 'ステータスは「下書き」または「公開」を選択してください。',

            'published_at.date' => '公開日時は有効な日付を入力してください。',
            'published_at.before_or_equal' => '公開日時は1年以内の日付を設定してください。',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title' => 'タイトル',
            'content' => '本文',
            'excerpt' => '抜粋',
            'status' => 'ステータス',
            'published_at' => '公開日時',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // 既存の記事を取得
        $post = Post::find($this->route('id'));

        if ($post) {
            // ステータスが下書きから公開に変更された場合
            if ($this->status === Post::STATUS_PUBLISHED &&
                $post->status === Post::STATUS_DRAFT &&
                ! $this->published_at) {
                $this->merge([
                    'published_at' => now()->toISOString(),
                ]);
            }

            // ステータスが公開から下書きに変更された場合
            if ($this->status === Post::STATUS_DRAFT &&
                $post->status === Post::STATUS_PUBLISHED) {
                $this->merge([
                    'published_at' => null,
                ]);
            }
        }
    }

    /**
     * Get validated data with proper handling.
     *
     * @param  string|null  $key
     * @param  mixed  $default
     * @return mixed
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);

        if ($key === null) {
            // ステータスが下書きの場合、published_atをnullに強制
            if (isset($validated['status']) && $validated['status'] === Post::STATUS_DRAFT) {
                $validated['published_at'] = null;
            }
        }

        return $validated;
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422)
        );
    }

    /**
     * Handle a failed authorization attempt.
     */
    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'You are not authorized to update posts.',
            ], 403)
        );
    }
}
