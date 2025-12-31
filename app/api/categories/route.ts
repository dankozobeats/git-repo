// API route pour lister/créer des catégories personnalisées.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateCategorySchema } from '@/lib/validation/schemas'
import { parseRequestBody, validateRequest } from '@/lib/validation/validate'

const isProd = process.env.NODE_ENV === 'production'

// Retourne toutes les catégories appartenant à l'utilisateur connecté.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('[categories GET] Database error:', error)
    return NextResponse.json({
      error: 'Impossible de récupérer les catégories',
      ...(isProd ? {} : { details: error.message })
    }, { status: 500 })
  }

  return NextResponse.json({ success: true, categories: data || [] })
}

// Crée une nouvelle catégorie avec un nom/couleur optionnelle.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Parse le corps de la requête
  const bodyResult = await parseRequestBody(request)
  if (!bodyResult.success) {
    return bodyResult.response
  }

  // Valide les données avec Zod
  const validationResult = validateRequest(CreateCategorySchema, bodyResult.data)
  if (!validationResult.success) {
    return validationResult.response
  }

  const { name, color } = validationResult.data

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      color: color || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[categories POST] Database error:', error)
    return NextResponse.json({
      error: 'Impossible de créer la catégorie',
      ...(isProd ? {} : { details: error.message })
    }, { status: 500 })
  }

  return NextResponse.json({ success: true, category: data })
}
