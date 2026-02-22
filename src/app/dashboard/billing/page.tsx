"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { useState } from "react";
import { isDevMode, DEV_USER } from "@/lib/devMode";

// Dodo product IDs from environment variables
const PRO_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRO_PRODUCT_ID || "";
const PRO_PLUS_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRO_PLUS_PRODUCT_ID || "";

const PLAN_CARDS = [
    {
        key: "free",
        name: "Free",
        price: 0,
        memories: 1000,
        searches: 1000,
        features: [
            "1,000 memories & retrievals",
            "Semantic search",
            "Memory graph",
            "Community support",
        ],
        cta: null, // No action for free
    },
    {
        key: "pro",
        name: "Pro",
        price: 9,
        memories: 5000,
        searches: 5000,
        productId: PRO_PRODUCT_ID,
        features: [
            "5,000 memories & retrievals",
            "Everything in Free",
            "Smart filtering & merging",
            "Profile extraction",
            "Priority support",
        ],
        cta: "Upgrade to Pro",
        popular: true,
    },
    {
        key: "pro_plus",
        name: "Pro+",
        price: 19,
        memories: 10000,
        searches: 10000,
        productId: PRO_PLUS_PRODUCT_ID,
        features: [
            "10,000 memories & retrievals",
            "Everything in Pro",
            "Advanced analytics",
            "Dedicated support",
            "Early access to features",
        ],
        cta: "Upgrade to Pro+",
    },
];

export default function BillingPage() {
    const devMode = isDevMode();
    const userQuery = useQuery(api.users.getCurrentUser, devMode ? "skip" : undefined);
    const user = devMode ? DEV_USER : userQuery;
    const createCheckout = useAction(api.payments.createCheckoutSession);
    const openPortal = useAction(api.payments.openCustomerPortal);
    const [loading, setLoading] = useState(false);
    const [couponError, setCouponError] = useState("");
    const [couponSuccess, setCouponSuccess] = useState("");

    const plan = user?.plan || "free";
    const isActive = user?.subscriptionStatus === "active";

    const handleUpgrade = async (productId: string) => {
        setLoading(true);
        try {
            const result = await createCheckout({
                productId,
                returnUrl: window.location.href + "?success=true",
            });
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error("Failed to create checkout:", error);
            alert("Failed to start checkout. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleManage = async () => {
        setLoading(true);
        try {
            const result = await openPortal({});
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error("Failed to open portal:", error);
            alert("Failed to open billing portal. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const [couponCode, setCouponCode] = useState("");
    const redeemCoupon = useMutation(api.coupons.redeemCoupon);

    const handleRedeem = async () => {
        if (!couponCode.trim()) return;
        setLoading(true);
        setCouponError("");
        setCouponSuccess("");
        try {
            const result = await redeemCoupon({ code: couponCode.trim() });
            if (result.success) {
                setCouponSuccess(`Successfully redeemed: +${result.memories} Memories, +${result.searches} Searches`);
                setCouponCode("");
            } else {
                if (result.error && result.error.includes("already redeemed")) {
                    setCouponError("Coupon already redeemed");
                } else {
                    setCouponError("Invalid coupon");
                }
            }
        } catch (error: any) {
            console.error("Failed to redeem coupon:", error);
            setCouponError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const planLimits: Record<string, { memories: number; searches: number }> = {
        free: { memories: 1000, searches: 1000 },
        pro: { memories: 5000, searches: 5000 },
        pro_plus: { memories: 10000, searches: 10000 },
    };

    const baseLimits = planLimits[plan] || planLimits.free;

    // Calculate effective limits (Base + Extra)
    const limits = {
        memories: baseLimits.memories + (user?.extraMemories || 0),
        searches: baseLimits.searches + (user?.extraSearches || 0),
    };

    const formatLimit = (limit: number) => {
        if (limit === Infinity) return "∞";
        if (limit >= 1000) return `${(limit / 1000).toFixed(1)}K`;
        return limit.toString();
    };

    const planDisplayName = (p: string) => {
        if (p === "pro_plus") return "Pro+";
        return p.charAt(0).toUpperCase() + p.slice(1);
    };

    // Determine plan hierarchy for upgrade/downgrade logic
    const planOrder = ["free", "pro", "pro_plus"];
    const currentPlanIndex = planOrder.indexOf(plan);

    return (
        <div className="min-h-full flex flex-col bg-background font-sans text-foreground">
            {/* Header */}
            <header className="h-20 px-8 flex items-end justify-between border-b border-foreground/10 relative z-10">
                <div className="pb-6">
                    <h1 className="text-sm font-medium tracking-widest uppercase opacity-70">
                        Billing & Plans
                    </h1>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-10">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Current Status Bar */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-foreground-muted uppercase tracking-wider text-xs">Current Plan</span>
                            <span className="text-lg font-light">{planDisplayName(plan)}</span>
                            {isActive && (
                                <span className="inline-flex items-center gap-1.5 text-[#4ade80] text-xs">
                                    <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
                                    Active
                                </span>
                            )}
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2 text-foreground-muted text-xs">
                            <span>{user?.memoriesStored || 0} / {formatLimit(limits.memories)} memories</span>
                            <span className="opacity-30">·</span>
                            <span>{user?.searchesMade || 0} / {formatLimit(limits.searches)} searches</span>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PLAN_CARDS.map((card) => {
                            const isCurrent = card.key === plan;
                            const cardIndex = planOrder.indexOf(card.key);
                            const isUpgrade = cardIndex > currentPlanIndex;
                            const isDowngrade = cardIndex < currentPlanIndex;

                            return (
                                <div
                                    key={card.key}
                                    className={`relative border p-8 flex flex-col transition-all duration-300 ${isCurrent
                                        ? "border-[#4ade80]/40 bg-[#4ade80]/[0.03]"
                                        : card.popular
                                            ? "border-foreground/20 hover:border-foreground/40"
                                            : "border-foreground/10 hover:border-foreground/20"
                                        }`}
                                >
                                    {/* Popular Badge */}
                                    {card.popular && !isCurrent && (
                                        <div className="absolute -top-3 left-6 px-3 py-0.5 bg-foreground text-background text-[10px] font-semibold uppercase tracking-widest">
                                            Popular
                                        </div>
                                    )}

                                    {/* Current Badge */}
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-6 px-3 py-0.5 bg-[#4ade80] text-black text-[10px] font-semibold uppercase tracking-widest">
                                            Current
                                        </div>
                                    )}

                                    {/* Plan Name & Price */}
                                    <div className="mb-6">
                                        <h3 className="text-xs font-medium tracking-widest uppercase text-foreground-muted mb-3">
                                            {card.name}
                                        </h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-light">
                                                ${card.price}
                                            </span>
                                            {card.price > 0 && (
                                                <span className="text-sm text-foreground-muted">/mo</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-8 flex-1">
                                        {card.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-sm">
                                                <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-foreground/80">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <div className="mt-auto">
                                        {isCurrent ? (
                                            isActive ? (
                                                <button
                                                    onClick={handleManage}
                                                    disabled={loading}
                                                    className={`w-full py-3 px-4 border border-foreground/10 text-foreground text-sm font-medium uppercase tracking-wider hover:bg-foreground/5 transition-all disabled:opacity-50 ${loading ? "opacity-70 animate-pulse" : ""}`}
                                                >
                                                    Manage Subscription
                                                </button>
                                            ) : (
                                                <div className="w-full py-3 px-4 border border-foreground/10 text-foreground-muted text-sm font-medium uppercase tracking-wider text-center">
                                                    Current Plan
                                                </div>
                                            )
                                        ) : isUpgrade ? (
                                            <button
                                                onClick={() => {
                                                    if (!card.productId) {
                                                        alert("Product ID not configured. Please set the environment variables.");
                                                        return;
                                                    }
                                                    handleUpgrade(card.productId);
                                                }}
                                                disabled={loading}
                                                className={`w-full py-3 px-4 text-sm font-medium uppercase tracking-wider transition-all disabled:opacity-50 ${card.popular
                                                    ? "bg-foreground text-background hover:opacity-90"
                                                    : "bg-foreground text-background hover:opacity-90"
                                                    } ${loading ? "opacity-70 animate-pulse" : ""}`}
                                            >
                                                {card.cta}
                                            </button>
                                        ) : isDowngrade ? (
                                            <button
                                                onClick={handleManage}
                                                disabled={loading || !isActive}
                                                className={`w-full py-3 px-4 border border-foreground/10 text-foreground-muted text-sm font-medium uppercase tracking-wider hover:bg-foreground/5 transition-all disabled:opacity-50 ${loading ? "opacity-70 animate-pulse" : ""}`}
                                            >
                                                Downgrade
                                            </button>
                                        ) : (
                                            <div className="w-full py-3 px-4 border border-foreground/10 text-foreground-muted text-sm font-medium uppercase tracking-wider text-center">
                                                Free Forever
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Memories */}
                        <div className="border border-foreground/10 p-8 bg-background hover:border-foreground/20 transition-colors">
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="text-xs font-medium tracking-widest uppercase text-foreground-muted">Memories Stored</h3>
                                {(user?.extraMemories || 0) > 0 && (
                                    <p className="text-[10px] text-[#4ade80] font-medium">+ {user?.extraMemories} Bonus</p>
                                )}
                            </div>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-3xl font-light">{user?.memoriesStored || 0}</span>
                                <span className="text-sm text-foreground-muted">/ {formatLimit(limits.memories)}</span>
                            </div>
                            <div className="h-1 w-full bg-foreground/10">
                                <div
                                    className="h-full bg-[#c084fc] transition-all duration-500"
                                    style={{ width: `${Math.min(((user?.memoriesStored || 0) / limits.memories) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Searches */}
                        <div className="border border-foreground/10 p-8 bg-background hover:border-foreground/20 transition-colors">
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="text-xs font-medium tracking-widest uppercase text-foreground-muted">Searches Made</h3>
                                {(user?.extraSearches || 0) > 0 && (
                                    <p className="text-[10px] text-[#4ade80] font-medium">+ {user?.extraSearches} Bonus</p>
                                )}
                            </div>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-3xl font-light">{user?.searchesMade || 0}</span>
                                <span className="text-sm text-foreground-muted">/ {formatLimit(limits.searches)}</span>
                            </div>
                            <div className="h-1 w-full bg-foreground/10">
                                <div
                                    className="h-full bg-[#60a5fa] transition-all duration-500"
                                    style={{ width: `${Math.min(((user?.searchesMade || 0) / limits.searches) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Redeem Coupon Section */}
                    <div className="border border-foreground/10 p-10 bg-background hover:border-foreground/20 transition-colors group">
                        <div className="max-w-xl">
                            <h2 className="text-xs font-medium tracking-widest uppercase text-foreground-muted mb-6 group-hover:text-foreground transition-colors">Redeem Coupon</h2>

                            <div className="relative">
                                <div className="flex items-center border-b border-foreground/20 focus-within:border-foreground transition-all duration-300 pb-1">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase());
                                            setCouponError("");
                                            setCouponSuccess("");
                                        }}
                                        placeholder="ENTER CODE"
                                        className="flex-1 px-2 py-3 bg-transparent outline-none text-2xl font-light placeholder:text-foreground-muted/20 uppercase tracking-widest"
                                    />
                                    <button
                                        onClick={handleRedeem}
                                        disabled={loading || !couponCode.trim()}
                                        className={`px-6 py-2 ml-4 text-xs font-medium border border-foreground/10 uppercase tracking-widest hover:bg-foreground hover:text-background disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground transition-all ${loading ? "opacity-70 animate-pulse" : ""}`}
                                    >
                                        REDEEM
                                    </button>
                                </div>
                                <div className="mt-2 min-h-[1rem]">
                                    {couponError && (
                                        <p className="text-[10px] text-red-500 font-medium uppercase tracking-widest">
                                            {couponError}
                                        </p>
                                    )}
                                    {couponSuccess && (
                                        <p className="text-[10px] text-[#4ade80] font-medium uppercase tracking-widest">
                                            {couponSuccess}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-foreground-muted mt-4 font-light">
                                Enter a valid coupon code to verify and apply bonus limits to your account immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
