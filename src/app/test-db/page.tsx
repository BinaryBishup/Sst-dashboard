"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function TestDBPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testDatabase() {
      try {
        // Test 1: Check products table
        const { data: products, error: productsError, count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .limit(5)

        // Test 2: Check categories table
        const { data: categories, error: categoriesError, count: categoriesCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact' })
          .limit(5)

        // Test 3: Check if product_type column exists
        const { data: oneProduct } = await supabase
          .from('products')
          .select('id, name, product_type')
          .limit(1)

        setResults({
          products: {
            data: products,
            error: productsError,
            count: productsCount,
            sample: oneProduct
          },
          categories: {
            data: categories,
            error: categoriesError,
            count: categoriesCount
          },
          connection: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          }
        })
      } catch (err) {
        setResults({ error: err })
      } finally {
        setLoading(false)
      }
    }

    testDatabase()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
        
        {loading ? (
          <p>Testing database connection...</p>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded">
              <h2 className="font-bold mb-2">Connection Status:</h2>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(results.connection, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <h2 className="font-bold mb-2">Products Table:</h2>
              <p>Count: {results.products?.count ?? 'N/A'}</p>
              {results.products?.error && (
                <p className="text-red-600">Error: {JSON.stringify(results.products.error)}</p>
              )}
              <pre className="text-xs overflow-auto mt-2">
                {JSON.stringify(results.products?.data, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <h2 className="font-bold mb-2">Categories Table:</h2>
              <p>Count: {results.categories?.count ?? 'N/A'}</p>
              {results.categories?.error && (
                <p className="text-red-600">Error: {JSON.stringify(results.categories.error)}</p>
              )}
              <pre className="text-xs overflow-auto mt-2">
                {JSON.stringify(results.categories?.data, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <h2 className="font-bold mb-2">Product Type Column Test:</h2>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(results.products?.sample, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}