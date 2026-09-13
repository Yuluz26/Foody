<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\StaffRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            // Panel access for every staff account; what they may do there is decided by role.
            'is_admin' => 'boolean',
            'role' => StaffRole::class,
            'approved_at' => 'datetime',
        ];
    }

    public function isApproved(): bool
    {
        return $this->approved_at !== null;
    }

    public function hasAdminRole(): bool
    {
        return $this->role === StaffRole::Admin;
    }

    public function canAccessPanel(): bool
    {
        return $this->is_admin && $this->isApproved();
    }
}
