<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
   /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Client::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition(): array
    {
        return [
            'CodeClient' => $this->faker->unique()->numerify('CLT###'),
            'raison_sociale' => $this->faker->company,
            'adresse' => $this->faker->address,
            'type_client' => $this->faker->randomElement(['Type1', 'Type2', 'Type3']),
            'categorie' => $this->faker->randomElement(['Cat1', 'Cat2', 'Cat3']),
            'tele' => $this->faker->phoneNumber,
            'ville' => $this->faker->city,
            'abreviation' => $this->faker->lexify('ABR???'),
            'code_postal' => $this->faker->postcode,
            'logoC' => $this->faker->imageUrl,
            'ice' => $this->faker->unique()->numerify('##########'),
            'user_id' => \App\Models\User::factory(),
            'zone_id' => \App\Models\Zone::factory(),
            'region_id' => \App\Models\Region::factory(),
        ];
    }
}
