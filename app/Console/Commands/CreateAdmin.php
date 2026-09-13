<?php

namespace App\Console\Commands;

use App\Enums\StaffRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin {--email= : Emel akaun admin}';

    protected $description = 'Cipta akaun admin aktif, atau pulihkan akaun yang terkunci (tetapkan semula kata laluan)';

    public function handle(): int
    {
        $email = (string) ($this->option('email') ?: $this->ask('Emel'));
        $user = User::query()->where('email', $email)->first();

        if ($user && ! $this->confirm("Akaun {$email} sudah wujud. Tetapkan semula kata laluannya dan jadikan admin aktif?")) {
            $this->warn('Dibatalkan. Tiada perubahan dibuat.');

            return self::FAILURE;
        }

        $name = $user?->name ?? (string) $this->ask('Nama');
        $password = (string) $this->secret('Kata laluan');
        $confirmation = (string) $this->secret('Sahkan kata laluan');

        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'password' => $password, 'password_confirmation' => $confirmation],
            [
                'name' => ['required', 'string', 'max:100'],
                'email' => ['required', 'string', 'email', 'max:255'],
                'password' => ['required', 'confirmed', Password::defaults()],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user ??= new User(['email' => $email]);
        $user->name = $name;
        $user->password = $password;
        $user->is_admin = true;
        $user->role = StaffRole::Admin;
        $user->approved_at ??= now();
        $user->save();

        Log::info('Admin account set up from the console', ['user_id' => $user->id, 'email' => $user->email, 'created' => $user->wasRecentlyCreated]);

        $this->info("Akaun admin {$user->email} sedia. Log masuk di ".route('admin.login'));

        return self::SUCCESS;
    }
}
