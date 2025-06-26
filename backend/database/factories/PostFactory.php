<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = $this->faker->randomElement(['published', 'draft']);

        return [
            'title' => $this->faker->sentence(),
            'content' => $this->faker->paragraphs(3, true),
            'status' => $status,
            'published_at' => $status === 'published' ? now() : null,
            'user_id' => \App\Models\User::factory(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * 公開状態の記事を生成
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'published_at' => now()->subMinute(), // 1分前に設定して確実に過去になるようにする
        ]);
    }

    /**
     * 下書き状態の記事を生成
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }
}
