<?php

namespace App\Http\Requests\Post;

use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class CreatePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
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
                'after_or_equal:now',
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
            'published_at.after_or_equal' => '公開日時は現在時刻以降を設定してください。',
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
        // ステータスが公開の場合、published_atが未設定なら現在時刻を設定
        if ($this->status === Post::STATUS_PUBLISHED && !$this->published_at) {
            $this->merge([
                'published_at' => now()->toISOString(),
            ]);
        }

        // ステータスが下書きの場合、published_atをnullに設定
        if ($this->status === Post::STATUS_DRAFT) {
            $this->merge([
                'published_at' => null,
            ]);
        }
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
                'message' => 'You are not authorized to create posts.',
            ], 403)
        );
    }
}
