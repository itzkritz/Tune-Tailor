import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password, username } = await req.json();

    if (!username || !password || password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 1. Check if user already exists in the custom users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: 'This Username is already taken!' },
        { status: 409 }
      );
    }

    // 2. Hash the password heavily
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Save to Supabase custom users table (bypassing native Email via silent proxy)
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, username, password_hash: hashedPassword }])
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json(
        { message: 'Database error occurred during registration.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Account securely created!', user: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
