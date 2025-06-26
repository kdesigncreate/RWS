<?php

namespace App\Http\Requests\Post;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class SearchPostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // 検索は誰でも可能（公開記事の場合）
        // 管理者用検索は別途ミドルウェアで制御
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => [
                'sometimes',
                'string',
                'max:100',
                'min:1',
            ],
            'status' => [
                'sometimes',
                'string',
                'in:draft,published,all',
            ],
            'page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:1000', // 最大1000ページまで
            ],
            'limit' => [
                'sometimes',
                'integer',
                'min:1',
                'max:20', // 最大50件まで（パフォーマンス考慮）
            ],
            'sort' => [
                'sometimes',
                'string',
                'in:created_at,published_at,title',
            ],
            'order' => [
                'sometimes',
                'string',
                'in:asc,desc',
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
            'search.string' => '検索キーワードは文字列で入力してください。',
            'search.max' => '検索キーワードは100文字以内で入力してください。',
            'search.min' => '検索キーワードは1文字以上入力してください。',

            'status.string' => 'ステータスは文字列で入力してください。',
            'status.in' => 'ステータスは「draft」「published」「all」のいずれかを指定してください。',

            'page.integer' => 'ページ番号は整数で入力してください。',
            'page.min' => 'ページ番号は1以上を指定してください。',
            'page.max' => 'ページ番号は1000以下を指定してください。',

            'limit.integer' => '表示件数は整数で入力してください。',
            'limit.min' => '表示件数は1以上を指定してください。',
            'limit.max' => '表示件数は50以下を指定してください。',

            'sort.string' => 'ソート項目は文字列で入力してください。',
            'sort.in' => 'ソート項目は「created_at」「published_at」「title」のいずれかを指定してください。',

            'order.string' => 'ソート順は文字列で入力してください。',
            'order.in' => 'ソート順は「asc」「desc」のいずれかを指定してください。',
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
            'search' => '検索キーワード',
            'status' => 'ステータス',
            'page' => 'ページ番号',
            'limit' => '表示件数',
            'sort' => 'ソート項目',
            'order' => 'ソート順',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // デフォルト値の設定
        $this->merge([
            'page' => $this->input('page', 1),
            'limit' => $this->input('limit', 10),
            'sort' => $this->input('sort', 'created_at'),
            'order' => $this->input('order', 'desc'),
        ]);

        // 検索キーワードのトリム
        if ($this->has('search')) {
            $this->merge([
                'search' => trim($this->input('search')),
            ]);
        }
    }

    /**
     * Get the validated search parameters.
     */
    public function getSearchParams(): array
    {
        return [
            'search' => $this->input('search'),
            'status' => $this->input('status'),
            'page' => (int) $this->input('page', 1),
            'limit' => (int) $this->input('limit', 10),
            'sort' => $this->input('sort', 'created_at'),
            'order' => $this->input('order', 'desc'),
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Invalid search parameters.',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
