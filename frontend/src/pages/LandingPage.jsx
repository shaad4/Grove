import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Silk from "../components/ui/Silk";

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Sparkles,
  ShieldCheck,
  Palette,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";

import Grainient from "../components/ui/Grainient";

import groveLogo from "../assets/Grove_transparent_logo(Green).png";

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 40,
  },

  show: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.7,
    },
  },
};

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [navbarBg, setNavbarBg] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavbarBg(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative overflow-x-hidden scroll-smooth text-[#141a14]">

      {/* SILK BACKGROUND */}
        <div className="fixed inset-0 -z-30">

        <Silk
            speed={6}
            scale={1.2}
            color="#109875"
            noiseIntensity={1.3}
            rotation={0.2}
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-[#f8fffc]/80 backdrop-blur-[100px]" />

        {/* EXTRA GLOWS */}
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-[#109875]/10 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[#48c9a9]/10 blur-3xl rounded-full" />
        </div>

      {/* NAVBAR */}
      <motion.header
        initial={{
          y: -80,
        }}
        animate={{
          y: 0,
        }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          navbarBg
            ? "bg-white/30 backdrop-blur-2xl border-b border-white/20 shadow-lg"
            : "bg-transparent"
        }`}
      >

        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* LOGO */}
          <Link
            to="/"
            className="relative flex items-center"
          >

            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
              }}
              className="absolute inset-0 blur-3xl bg-[#109875]/30 rounded-full"
            />

            <motion.img
              whileHover={{
                scale: 1.05,
              }}
              src={groveLogo}
              alt="Grove"
              className="relative h-14 md:h-16 object-contain"
            />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-gray-600">

            <a
              href="#features"
              className="hover:text-[#109875] transition"
            >
              Features
            </a>

            <a
              href="#dashboard"
              className="hover:text-[#109875] transition"
            >
              Dashboard
            </a>

            <a
              href="#pricing"
              className="hover:text-[#109875] transition"
            >
              Pricing
            </a>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">

            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-black transition"
            >
              Login
            </Link>

            <motion.div
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.97,
              }}
            >

              <Link
                to="/signup"
                className="bg-[#109875] hover:bg-[#0d8666] text-white px-6 py-3 rounded-full font-semibold shadow-xl shadow-[#109875]/20 transition"
              >
                Get Started
              </Link>
            </motion.div>
          </div>

          {/* MOBILE */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenu && (
          <motion.div
            initial={{
              opacity: 0,
              y: -20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="md:hidden mx-4 mb-4 bg-white/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-6"
          >

            <div className="space-y-5">

              <a
                href="#features"
                className="block font-medium"
              >
                Features
              </a>

              <a
                href="#dashboard"
                className="block font-medium"
              >
                Dashboard
              </a>

              <a
                href="#pricing"
                className="block font-medium"
              >
                Pricing
              </a>

              <Link
                to="/login"
                className="block font-medium"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="block bg-[#109875] text-white rounded-2xl text-center py-4 font-semibold"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* HERO */}
      <section className="relative pt-44 pb-28 px-6">

        <div className="max-w-7xl mx-auto">

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-center"
          >

            <motion.div
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
              className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-[#109875]/20 px-5 py-2 rounded-full text-[#109875] text-sm font-semibold shadow-lg"
            >
              <Sparkles size={16} />
              AI Powered Client Management
            </motion.div>

            <h1 className="mt-10 text-6xl md:text-8xl font-black tracking-tight leading-tight max-w-5xl mx-auto">
              Client Management,
              <br />

              <span className="bg-gradient-to-r from-[#109875] to-[#48c9a9] bg-clip-text text-transparent">
                Without the Chaos
              </span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-gray-500 leading-9 max-w-3xl mx-auto">
              Multi-tenant onboarding and request
              management platform for agencies,
              freelancers, and service providers.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-5">

              <motion.div
                whileHover={{
                  scale: 1.03,
                }}
                whileTap={{
                  scale: 0.97,
                }}
              >

                <Link
                  to="/signup"
                  className="bg-[#109875] hover:bg-[#0d8666] text-white px-8 py-4 rounded-full font-semibold shadow-2xl shadow-[#109875]/30 transition"
                >
                  Start Free Trial
                </Link>
              </motion.div>

              <motion.a
                whileHover={{
                  y: -2,
                }}
                href="#dashboard"
                className="border border-gray-300 hover:border-[#109875] hover:text-[#109875] bg-white/70 backdrop-blur-xl px-8 py-4 rounded-full font-semibold transition"
              >
                Explore Dashboard
              </motion.a>
            </div>

            <div className="mt-12 text-sm text-gray-500">
              Trusted by 500+ service providers
            </div>
          </motion.div>

          {/* DASHBOARD */}
          <motion.div
            id="dashboard"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{
              once: true,
            }}
            className="mt-28"
          >

            <motion.div
              whileHover={{
                y: -8,
                rotateX: 2,
                rotateY: -2,
              }}
              className="relative bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[36px] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.08)]"
            >

              <div className="absolute top-0 right-0 w-80 h-80 bg-[#109875]/10 blur-3xl rounded-full" />

              {/* TOPBAR */}
              <div className="h-14 border-b bg-[#fafafa]/80 flex items-center justify-between px-6">

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>

                <div className="hidden md:block text-xs text-gray-400">
                  app.grove.com/dashboard
                </div>
              </div>

              <div className="grid lg:grid-cols-[280px_1fr]">

                {/* SIDEBAR */}
                <div className="border-r bg-[#fafafa] p-6">

                  <div className="flex items-center gap-3 mb-10">

                    <div className="w-11 h-11 rounded-2xl bg-[#109875] text-white flex items-center justify-center font-bold">
                      G
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        Design Co.
                      </h3>

                      <p className="text-xs text-gray-500">
                        Workspace
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">

                    {[
                      {
                        icon: LayoutDashboard,
                        title: "Overview",
                        active: true,
                      },

                      {
                        icon: Users,
                        title: "Clients",
                      },

                      {
                        icon: FolderKanban,
                        title: "Requests",
                      },
                    ].map((item) => (
                      <motion.div
                        whileHover={{
                          x: 4,
                        }}
                        key={item.title}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition ${
                          item.active
                            ? "bg-white shadow-sm border"
                            : "hover:bg-white text-gray-500"
                        }`}
                      >

                        <item.icon size={18} />

                        <span className="font-medium text-sm">
                          {item.title}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-8 lg:p-10">

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

                    <div>
                      <h2 className="text-3xl font-bold">
                        Active Requests
                      </h2>

                      <p className="text-gray-500 mt-2">
                        Manage client tasks visually.
                      </p>
                    </div>

                    <button className="bg-[#109875] hover:bg-[#0d8666] text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-[#109875]/20">
                      New Request
                    </button>
                  </div>

                  <div className="space-y-5">

                    {[
                      {
                        title: "Brand Identity Redesign",
                        company: "Acme Corp",
                        status: "In Progress",
                        color:
                          "bg-indigo-100 text-indigo-600",
                      },

                      {
                        title: "Website Copywriting",
                        company: "TechFlow",
                        status: "Review",
                        color:
                          "bg-orange-100 text-orange-600",
                      },

                      {
                        title: "Q3 Social Assets",
                        company: "Growth Co",
                        status: "Done",
                        color:
                          "bg-green-100 text-green-600",
                      },
                    ].map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{
                          opacity: 0,
                          y: 20,
                        }}
                        whileInView={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay: i * 0.12,
                        }}
                        whileHover={{
                          y: -4,
                          scale: 1.01,
                        }}
                        className="bg-white border border-gray-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-xl transition"
                      >

                        <div className="flex items-center gap-5">

                          <div className="w-14 h-14 rounded-2xl bg-[#109875]/10 flex items-center justify-center">
                            <Sparkles
                              className="text-[#109875]"
                              size={22}
                            />
                          </div>

                          <div>
                            <h3 className="font-semibold text-lg">
                              {item.title}
                            </h3>

                            <p className="text-gray-500 mt-1">
                              {item.company}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${item.color}`}
                        >
                          {item.status}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="py-32 border-t border-gray-200/30 bg-white/20 backdrop-blur-xl px-6"
      >

        <div className="max-w-7xl mx-auto">

          <div className="text-center">

            <p className="uppercase tracking-[4px] text-[#109875] font-bold text-sm">
              Features
            </p>

            <h2 className="mt-5 text-5xl font-black">
              Everything you need
              <br />
              to run client work
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mt-20">

            {[
              {
                icon: ShieldCheck,
                title: "Isolated Client Portals",
                desc:
                  "Every client gets their own secure branded workspace.",
              },

              {
                icon: FolderKanban,
                title: "Real-Time Tracking",
                desc:
                  "Track every request visually with live updates.",
              },

              {
                icon: Palette,
                title: "White Label Branding",
                desc:
                  "Custom logos, domains, and colors for your business.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{
                  opacity: 0,
                  y: 40,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: i * 0.15,
                }}
                whileHover={{
                  y: -10,
                }}
                className="group relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-[32px] p-10 shadow-sm hover:shadow-2xl transition"
              >

                <div className="absolute top-0 right-0 w-40 h-40 bg-[#109875]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition duration-500" />

                <div className="relative w-16 h-16 rounded-2xl bg-[#109875]/10 flex items-center justify-center mb-8">

                  <item.icon
                    size={28}
                    className="text-[#109875]"
                  />
                </div>

                <h3 className="text-2xl font-bold mb-5">
                  {item.title}
                </h3>

                <p className="text-gray-500 leading-8">
                  {item.desc}
                </p>

                <button className="mt-8 flex items-center gap-2 text-[#109875] font-semibold">
                  Learn More
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="py-32 px-6"
      >

        <div className="max-w-7xl mx-auto text-center">

          <p className="uppercase tracking-[4px] text-[#109875] font-bold text-sm">
            Pricing
          </p>

          <h2 className="mt-5 text-5xl font-black">
            Simple pricing
            <br />
            for growing teams
          </h2>

          <p className="mt-6 text-gray-500 max-w-2xl mx-auto text-lg">
            Start free and upgrade only when your
            business grows.
          </p>

          <div className="grid lg:grid-cols-2 gap-8 mt-20">

            {/* FREE */}
            <motion.div
              whileHover={{
                y: -8,
              }}
              className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[36px] p-10 shadow-xl text-left"
            >

              <h3 className="text-3xl font-bold">
                Free
              </h3>

              <p className="text-gray-500 mt-3">
                Perfect for freelancers starting out.
              </p>

              <div className="mt-8">
                <span className="text-6xl font-black">
                  $0
                </span>

                <span className="text-gray-500 ml-2">
                  /month
                </span>
              </div>

              <div className="mt-10 space-y-5">

                {[
                  "3 Clients",
                  "10 Active Requests",
                  "Real-time updates",
                  "Client portals",
                  "Basic branding",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3"
                  >

                    <CheckCircle2
                      size={20}
                      className="text-[#109875]"
                    />

                    <span className="text-gray-700">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/signup"
                className="mt-12 inline-flex bg-[#109875] text-white px-7 py-4 rounded-full font-semibold hover:bg-[#0d8666] transition"
              >
                Start Free
              </Link>
            </motion.div>

            {/* PRO */}
            <motion.div
              whileHover={{
                y: -8,
              }}
              className="relative overflow-hidden bg-[#061a15] text-white rounded-[36px] p-10 shadow-[0_40px_120px_rgba(16,152,117,0.25)] text-left"
            >

              <div className="absolute top-0 right-0 w-80 h-80 bg-[#109875]/20 blur-3xl rounded-full" />

              <div className="relative">

                <div className="inline-flex bg-[#109875]/20 text-[#8ef0d4] px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </div>

                <h3 className="text-3xl font-bold mt-6">
                  Pro
                </h3>

                <p className="text-gray-300 mt-3">
                  Built for agencies and serious teams.
                </p>

                <div className="mt-8">
                  <span className="text-6xl font-black">
                    $29
                  </span>

                  <span className="text-gray-400 ml-2">
                    /month
                  </span>
                </div>

                <div className="mt-10 space-y-5">

                  {[
                    "Unlimited clients",
                    "Unlimited requests",
                    "Advanced analytics",
                    "White-label branding",
                    "Priority support",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3"
                    >

                      <CheckCircle2
                        size={20}
                        className="text-[#48c9a9]"
                      />

                      <span className="text-gray-200">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/signup"
                  className="mt-12 inline-flex bg-white text-[#061a15] px-7 py-4 rounded-full font-semibold hover:bg-gray-100 transition"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/20 bg-white/40 backdrop-blur-2xl">

        <div className="max-w-7xl mx-auto px-6 py-14">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">

            <div>

              <img
                src={groveLogo}
                alt="Grove"
                className="h-12 object-contain"
              />

              <p className="mt-5 text-gray-500 max-w-md leading-7">
                Modern multi-tenant client onboarding
                and request management platform for
                agencies, freelancers, and service
                providers.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-10 text-sm">

              <div className="space-y-4">

                <h4 className="font-bold text-black">
                  Product
                </h4>

                <div className="space-y-3 text-gray-500">

                  <a href="#features">
                    Features
                  </a>

                  <a href="#dashboard">
                    Dashboard
                  </a>

                  <a href="#pricing">
                    Pricing
                  </a>
                </div>
              </div>

              <div className="space-y-4">

                <h4 className="font-bold text-black">
                  Company
                </h4>

                <div className="space-y-3 text-gray-500">

                  <a>
                    About
                  </a>

                  <a>
                    Careers
                  </a>

                  <a>
                    Contact
                  </a>
                </div>
              </div>

              <div className="space-y-4">

                <h4 className="font-bold text-black">
                  Legal
                </h4>

                <div className="space-y-3 text-gray-500">

                  <a>
                    Privacy
                  </a>

                  <a>
                    Terms
                  </a>

                  <a>
                    Security
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-white/20 flex flex-col md:flex-row md:items-center md:justify-between gap-5 text-sm text-gray-500">

            <p>
              © 2026 Grove. All rights reserved.
            </p>

            <p>
              Built with React, Django, Redis &
              WebSockets
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}