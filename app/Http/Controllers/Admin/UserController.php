<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        $users = User::select(['id', 'name', 'email', 'role', 'created_at', 'last_login_at'])
            ->paginate(10);
        
        return Inertia::render('admin/users/index', [
            'users' => $users
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        return Inertia::render('admin/users/create');
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role' => ['required', Rule::in(['user', 'admin'])],
        ]);

        // Generate random password
        $randomPassword = Str::random(12);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => Hash::make($randomPassword),
        ]);

        return back()->with('success', [
            'message' => 'User created successfully!',
            'password' => $randomPassword,
            'user' => $user->only(['id', 'name', 'email', 'role'])
        ]);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        return Inertia::render('admin/users/show', [
            'user' => $user->only(['id', 'name', 'email', 'role', 'created_at', 'last_login_at'])
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        return Inertia::render('admin/users/edit', [
            'user' => $user->only(['id', 'name', 'email', 'role'])
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'email' => ['required', 'string', 'email', 'max:100', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['user', 'admin'])],
        ]);

        $user->update($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully!');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        // Prevent admin from deleting themselves
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully!');
    }

    /**
     * Generate new password for user (only if user hasn't logged in yet)
     */
    public function generatePassword(User $user)
    {
        // Check if user has ever logged in
        if ($user->last_login_at !== null) {
            return back()->withErrors(['error' => 'Cannot generate new password for users who have already logged in.']);
        }

        $randomPassword = Str::random(12);
        
        $user->update([
            'password' => Hash::make($randomPassword)
        ]);

        return back()->with('success', [
            'message' => 'New password generated successfully!',
            'password' => $randomPassword,
            'user' => $user->only(['id', 'name', 'email'])
        ]);
    }
}