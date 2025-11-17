"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, ArrowLeft, Check, Camera } from "lucide-react";
import { useRouter } from "next/navigation";

const styleOptions = [
  "Casual & Comfy",
  "Business Casual",
  "Streetwear",
  "Formal & Elegant",
  "Sporty & Athletic",
  "Minimalist",
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/sign-in");
      }
    };
    
    checkAuth();
  }, [router]);

  const handleStyleToggle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleComplete = async () => {
    try {
      setSaving(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      await supabase
        .from("profiles")
        .update({
          style_preferences: {
            preferences: selectedStyles,
            notes: additionalNotes,
          },
        })
        .eq("id", user.id);

      router.push("/");
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <span className="font-heading text-2xl text-gray-900">SetMyFit</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-8 md:p-12">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8 gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    step < currentStep
                      ? "bg-teal-500 text-white"
                      : step === currentStep
                      ? "bg-[var(--primary)] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <Check className="w-6 h-6" /> : step}
                </div>
                {step < 3 && (
                  <div className="w-16 md:w-24 h-1 mx-2">
                    <div
                      className={`h-full transition-all ${
                        step < currentStep ? "bg-teal-500" : "bg-gray-200"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--primary)] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="font-heading text-2xl md:text-3xl text-gray-900">
                    What's Your Vibe?
                  </h2>
                  <p className="text-gray-600">
                    Help our AI stylist get to know you. The more it knows, the better your fits!
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-900">
                    My style is often...
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {styleOptions.map((style) => (
                      <button
                        key={style}
                        onClick={() => handleStyleToggle(style)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          selectedStyles.includes(style)
                            ? "border-[var(--primary)] bg-[var(--primary)]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedStyles.includes(style)
                                ? "border-[var(--primary)] bg-[var(--primary)]"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedStyles.includes(style) && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {style}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-900">
                    Anything else we should know?
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="e.g., I never wear yellow, I love vintage band tees, comfort is key..."
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[var(--primary)] focus:outline-none text-sm resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    This helps the AI fine-tune your recommendations
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="font-heading text-2xl md:text-3xl text-gray-900">
                    Build Your Virtual Wardrobe
                  </h2>
                  <p className="text-gray-600">
                    Start by adding a few items. Good photos get the best results!
                  </p>
                </div>

                {/* Upload Tips Card */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                      <Camera className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="font-semibold text-gray-900">Photo Tips</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <p>Use a flat, neutral background with good lighting</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <p>Lay item flat or hang it on a plain wall/door</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs text-red-600">✕</span>
                          </div>
                          <p>Avoid cluttered, dark, or wrinkled photos</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Example comparison would go here in the real implementation */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/50">
                    <div className="space-y-2">
                      <div className="aspect-square bg-white rounded-xl border-2 border-green-400 flex items-center justify-center">
                        <span className="text-4xl">👕</span>
                      </div>
                      <p className="text-xs font-semibold text-green-700 text-center">
                        Good Photo
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="aspect-square bg-gray-800 rounded-xl border-2 border-red-400 flex items-center justify-center">
                        <span className="text-4xl opacity-30">👕</span>
                      </div>
                      <p className="text-xs font-semibold text-red-700 text-center">
                        Bad Photo
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/wardrobe/upload")}
                  className="w-full bg-[var(--primary)] text-white px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-opacity"
                >
                  Start Uploading Items
                </button>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h2 className="font-heading text-2xl md:text-3xl text-gray-900">
                    Your Style Preview
                  </h2>
                  <p className="text-gray-600">
                    Here's a starter idea our AI stylist whipped up for you!
                  </p>
                </div>

                {/* Outfit suggestion placeholder */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">👔</div>
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold text-gray-900">Outfit Suggestion</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        A light-wash denim shirt, unbuttoned over a simple white crew-neck t-shirt, 
                        paired with relaxed-fit olive chinos and white canvas sneakers. Accessorize 
                        with a minimalist watch.
                      </p>
                      <p className="text-xs text-gray-600 mt-4 italic">
                        ✨ This outfit perfectly aligns with a casual preference, offering comfort 
                        and style for mild, sunny weather
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-center">What happens next?</h3>
                  <div className="space-y-3">
                    {[
                      { num: "1️⃣", text: 'Visit your dashboard and tap "Get Outfit"' },
                      { num: "2️⃣", text: "We'll suggest 1–3 outfits with reasons why they work" },
                      { num: "3️⃣", text: "Generate a visual preview and swap items if you want" },
                      { num: "4️⃣", text: "Save outfits you love and track what you wear!" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{item.num}</span>
                        <p className="text-sm text-gray-700 pt-1">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => {
                if (currentStep === 3) {
                  handleComplete();
                } else {
                  setCurrentStep((prev) => Math.min(3, prev + 1));
                }
              }}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
            >
              {currentStep === 3 ? (saving ? "Saving..." : "Let's Go!") : "Next"}
              {currentStep < 3 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          SetMyFit Alpha v0.1
        </p>
      </div>
    </div>
  );
}
