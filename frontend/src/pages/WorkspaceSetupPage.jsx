// src/pages/WorkspaceSetupPage.jsx

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Globe,
  Loader2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Building2,
} from 'lucide-react'

import { authApi } from '../api/auth.api'
import { useAuth } from '../context/AuthContext'

import groveLogo from '../assets/Grove_transparent_logo(Green).png'

const schema = z.object({
  business_name: z
    .string()
    .min(2, 'Business name is required')
    .max(50, 'Too long'),

  slug: z
    .string()
    .min(3, 'Minimum 3 characters')
    .max(63, 'Maximum 63 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Only lowercase letters, numbers and hyphens allowed'
    ),
})

export default function WorkspaceSetupPage() {

  const navigate = useNavigate()

  const {
    saveSession,
    tenant,
  } = useAuth()

  const [serverError, setServerError] = useState('')
  const [slugStatus, setSlugStatus] = useState('idle')

  // redirect if already onboarded
  useEffect(() => {
    if (tenant) {
      navigate('/dashboard')
    }
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const businessName = watch('business_name')
  const slug = watch('slug')

  // auto generate slug
  useEffect(() => {

    if (!businessName) return

    const generatedSlug = businessName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    setValue(
      'slug',
      generatedSlug
    )

  }, [businessName])

  // realtime slug check
  useEffect(() => {

    if (!slug || slug.length < 3) {
      setSlugStatus('idle')
      return
    }

    const timeout = setTimeout(async () => {

      try {

        setSlugStatus('checking')

        const res = await authApi.checkSlug(slug)

        console.log('SLUG CHECK:', res.data)

        if (res.data.available) {
          setSlugStatus('available')
        } else {
          setSlugStatus('taken')
        }

      } catch (err) {

        console.log(err.response?.data)

        setSlugStatus('taken')
      }

    }, 500)

    return () => clearTimeout(timeout)

  }, [slug])

  const workspaceUrl = useMemo(() => {

    if (!slug) {
      return 'grove.app/workspace'
    }

    return `grove.app/${slug}`

  }, [slug])

  const onSubmit = async (data) => {

    try {

      setServerError('')

      // prevent submit if slug taken
      if (slugStatus === 'taken') {
        setServerError(
          'This workspace URL is already taken.'
        )
        return
      }

      const res = await authApi.setupWorkspace(data)

      console.log(res.data)

      const payload = res.data.data

      saveSession({
        accessToken: payload.tokens.access,
        user: payload.user,
        tenant: payload.tenant,
      })

      navigate('/dashboard')

    } catch (err) {

      console.log(err.response?.data)

      const errorData = err.response?.data

      // serializer slug validation
      if (errorData?.slug?.[0]) {
        setServerError(errorData.slug[0])
        return
      }

      // structured backend error
      if (errorData?.error?.message) {
        setServerError(errorData.error.message)
        return
      }

      // generic backend message
      if (errorData?.message) {
        setServerError(errorData.message)
        return
      }

      setServerError('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8f6] flex">

      {/* LEFT */}
      <div className="w-full lg:w-[52%] flex items-center justify-center px-6 py-12 lg:px-12">

        <div className="w-full max-w-[470px]">

          {/* LOGO */}
          <div className="mb-10">
            <img
              src={groveLogo}
              alt="Grove"
              className="h-14 w-auto"
            />
          </div>

          {/* HEADER */}
          <div className="mb-8">

            <div
              className="
                inline-flex items-center gap-2
                rounded-full border border-[#dce7e1]
                bg-white px-3 py-1.5
                text-xs font-medium text-[#0f7b5f]
                shadow-sm
              "
            >
              <Sparkles size={14} />
              Final onboarding step
            </div>

            <h1
              className="
                mt-5 text-[42px]
                font-semibold leading-[1.05]
                tracking-tight text-[#17352c]
              "
            >
              Create your workspace
            </h1>

            <p
              className="
                mt-4 text-[16px]
                leading-relaxed text-[#74837d]
              "
            >
              Set up your business identity and
              unique workspace URL.
            </p>
          </div>

          {/* ERROR */}
          {serverError && (
            <div
              className="
                mb-5 rounded-2xl
                border border-red-200
                bg-red-50 px-4 py-3
                text-sm text-red-500
              "
            >
              {serverError}
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >

            {/* BUSINESS NAME */}
            <div>

              <label
                className="
                  mb-2 block text-sm
                  font-medium text-[#17352c]
                "
              >
                Business name
              </label>

              <div className="relative">

                <Building2
                  size={18}
                  className="
                    absolute left-4 top-1/2
                    -translate-y-1/2 text-[#98a39f]
                  "
                />

                <input
                  type="text"
                  placeholder="Acme Studio"
                  {...register('business_name')}
                  className="
                    h-12 w-full rounded-2xl
                    border border-[#dce3df]
                    bg-white pl-12 pr-4
                    text-sm text-[#17352c]
                    placeholder:text-[#9aa6a1]
                    outline-none transition-all
                    focus:border-[#0f7b5f]
                    focus:ring-4
                    focus:ring-[#0f7b5f]/10
                  "
                />
              </div>

              {errors.business_name && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.business_name.message}
                </p>
              )}
            </div>

            {/* SLUG */}
            <div>

              <label
                className="
                  mb-2 block text-sm
                  font-medium text-[#17352c]
                "
              >
                Workspace URL
              </label>

              <div
                className="
                  rounded-2xl border
                  border-[#dce3df]
                  bg-white px-4 py-3
                  transition-all
                  focus-within:border-[#0f7b5f]
                  focus-within:ring-4
                  focus-within:ring-[#0f7b5f]/10
                "
              >

                <div className="flex items-center gap-3">

                  <Globe
                    size={18}
                    className="text-[#98a39f]"
                  />

                  <span className="text-sm text-[#8b9893]">
                    grove.app/
                  </span>

                  <input
                    type="text"
                    {...register('slug')}
                    className="
                      flex-1 bg-transparent
                      text-sm text-[#17352c]
                      outline-none
                      placeholder:text-[#a1aba7]
                    "
                    placeholder="acme-studio"
                  />

                  {/* STATUS */}
                  {slugStatus === 'checking' && (
                    <Loader2
                      size={18}
                      className="
                        animate-spin text-[#98a39f]
                      "
                    />
                  )}

                  {slugStatus === 'available' && (
                    <CheckCircle2
                      size={18}
                      className="text-emerald-500"
                    />
                  )}

                  {slugStatus === 'taken' && (
                    <XCircle
                      size={18}
                      className="text-red-500"
                    />
                  )}
                </div>
              </div>

              <div
                className="
                  mt-2 flex items-center
                  justify-between
                "
              >

                <p className="text-xs text-[#97a39e]">
                  Only lowercase letters,
                  numbers and hyphens.
                </p>

                {slugStatus === 'available' && (
                  <p
                    className="
                      text-xs font-medium
                      text-emerald-600
                    "
                  >
                    Available
                  </p>
                )}

                {slugStatus === 'taken' && (
                  <p
                    className="
                      text-xs font-medium
                      text-red-500
                    "
                  >
                    Already taken
                  </p>
                )}
              </div>

              {errors.slug && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.slug.message}
                </p>
              )}
            </div>

            {/* PREVIEW */}
            <div
              className="
                rounded-3xl border
                border-[#dce7e1]
                bg-white p-5 shadow-sm
              "
            >

              <div
                className="
                  flex items-center
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-xs font-medium
                      uppercase tracking-[0.2em]
                      text-[#97a39e]
                    "
                  >
                    Workspace Preview
                  </p>

                  <h3
                    className="
                      mt-2 text-lg
                      font-semibold text-[#17352c]
                    "
                  >
                    {businessName || 'Your Workspace'}
                  </h3>

                  <p
                    className="
                      mt-1 text-sm text-[#73827d]
                    "
                  >
                    {workspaceUrl}
                  </p>
                </div>

                <div
                  className="
                    rounded-2xl
                    bg-[#0f7b5f]
                    px-4 py-2 text-sm
                    font-medium text-white
                  "
                >
                  Live
                </div>
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                slugStatus === 'taken' ||
                slugStatus === 'checking'
              }
              className="
                h-12 w-full rounded-2xl
                bg-[#0f7b5f] text-white
                transition-all
                hover:bg-[#0c6d54]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {isSubmitting ? (
                <div
                  className="
                    flex items-center
                    justify-center gap-2
                  "
                >
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Creating workspace...
                </div>
              ) : (
                <div
                  className="
                    flex items-center
                    justify-center gap-2
                  "
                >
                  Launch workspace

                  <ArrowRight size={16} />
                </div>
              )}

            </button>

          </form>
        </div>
      </div>

      {/* RIGHT */}
      <div
        className="
          hidden lg:flex relative
          w-[48%]
          border-l border-[#e5ebe7]
          bg-[#f4f7f5]
          overflow-hidden
          items-center justify-center
          px-14
        "
      >

        {/* BLUR */}
        <div
          className="
            absolute top-[-120px]
            right-[-120px]
            h-[300px] w-[300px]
            rounded-full
            bg-[#0f7b5f]/10 blur-3xl
          "
        />

        <div
          className="
            absolute bottom-[-120px]
            left-[-120px]
            h-[260px] w-[260px]
            rounded-full
            bg-[#17a56b]/10 blur-3xl
          "
        />

        {/* CARD */}
        <div
          className="
            relative z-10
            w-full max-w-[430px]
            rounded-[36px]
            border border-[#dfe8e3]
            bg-white/90 p-6
            shadow-[0_20px_60px_rgba(15,123,95,0.08)]
            backdrop-blur
          "
        >

          {/* TOP */}
          <div className="mb-5 flex items-center gap-2">

            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />

            <div
              className="
                ml-4 flex-1
                rounded-full bg-[#f4f7f5]
                px-4 py-1 text-center
                text-[11px] text-[#97a39e]
              "
            >
              {workspaceUrl}
            </div>
          </div>

          {/* HERO */}
          <div
            className="
              rounded-[28px]
              bg-[#0f7b5f]
              p-6 text-white
            "
          >

            <p className="text-sm text-white/70">
              Workspace
            </p>

            <h2
              className="
                mt-2 text-[28px]
                font-semibold
              "
            >
              {businessName || 'Your Business'}
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3">

              {[
                'Client Portals',
                'Invoices',
                'Approvals',
                'Automation',
              ].map((item) => (
                <div
                  key={item}
                  className="
                    rounded-2xl
                    bg-white/10
                    px-4 py-4 text-sm
                  "
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 space-y-4">

            {[
              'Realtime client collaboration',
              'Private branded workspace',
              'AI workflow automation',
            ].map((item) => (
              <div
                key={item}
                className="
                  flex items-center gap-3
                "
              >

                <CheckCircle2
                  size={18}
                  className="text-[#17a56b]"
                />

                <p
                  className="
                    text-sm text-[#73827d]
                  "
                >
                  {item}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}