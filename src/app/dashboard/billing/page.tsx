"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/lib/convex"; // Using relative for now if this fails
import { useState } from "react";

// TODO: Replace with your actual Dodo product ID
const PRO_PRODUCT_ID = "YOUR_DODO_PRO_PRODUCT_ID";

export default function BillingPage() {
    const user = useQuery(api.users.getCurrentUser);
    const createCheckout = useAction(api.payments.createCheckoutSession);
    const openPortal = useAction(api.payments.openCustomerPortal);
    const [loading, setLoading] = useState(false);

    const plan = user?.plan || "free";
    const isActive = user?.subscriptionStatus === "active";

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const result = await createCheckout({
                productId: PRO_PRODUCT_ID,
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
        try {
            const result = await redeemCoupon({ code: couponCode.trim() });
            if (result.success) {
                alert(`Successfully redeemed!\n+${result.memories} Memories\n+${result.searches} Searches`);
                setCouponCode("");
            }
        } catch (error: any) {
            console.error("Failed to redeem coupon:", error);
            alert(error.message || "Failed to redeem coupon. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const planLimits = {
        free: { memories: 100, searches: 100 },
        pro: { memories: 5000, searches: 5000 },
        enterprise: { memories: Infinity, searches: Infinity },
    };

    const baseLimits = planLimits[plan as keyof typeof planLimits] || planLimits.free;

    // Calculate effective limits (Base + Extra)
    const limits = {
        memories: typeof baseLimits.memories === "number"
            ? baseLimits.memories + (user?.extraMemories || 0)
            : baseLimits.memories,
        searches: typeof baseLimits.searches === "number"
            ? baseLimits.searches + (user?.extraSearches || 0)
            : baseLimits.searches,
    };

    const formatLimit = (limit: number) => {
        if (limit === Infinity) return "∞";
        if (limit >= 1000) return `${(limit / 1000).toFixed(1)}K`;
        return limit.toString();
    };

    return (
        <div className="min-h-full flex flex-col bg-background font-sans text-foreground">
            {/* Header */}
            <header className="h-20 px-8 flex items-end justify-between border-b border-foreground/10 relative z-10">
                <div className="pb-6">
                    <h1 className="text-sm font-medium tracking-widest uppercase opacity-70">
                        Billing & Limits
                    </h1>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-10">
                <div className="max-w-5xl mx-auto space-y-12">
                    {/* Current Plan Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Plan Status */}
                        <div className="md:col-span-1 border border-foreground/10 p-8 flex flex-col justify-between h-full bg-background relative group hover:border-foreground/20 transition-colors">
                            <div>
                                <h2 className="text-xs font-medium tracking-widest uppercase text-foreground-muted mb-4">Current Plan</h2>
                                <div className="text-5xl font-light tracking-tight mb-2 capitalize">{plan}</div>
                                {isActive && (
                                    <div className="inline-flex items-center gap-2 text-[#4ade80] text-sm">
                                        <div className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
                                        Active
                                    </div>
                                )}
                            </div>

                            {/* Management Actions */}
                            <div className="mt-8 pt-6 border-t border-foreground/10">
                                {plan === 'free' ? (
                                    <button
                                        disabled={loading}
                                        className="w-full py-3 px-4 bg-foreground text-background text-sm font-medium uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 cursor-default"
                                    >
                                        {loading ? "Processing..." : "Pro [Coming Soon]"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleManage}
                                        disabled={loading}
                                        className="w-full py-3 px-4 border border-foreground/10 text-foreground text-sm font-medium uppercase tracking-wider hover:bg-foreground/5 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? "Processing..." : "Manage Subscription"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Usage Stats (Memories & Searches) */}
                        <div className="md:col-span-2 border border-foreground/10 p-8 bg-background hover:border-foreground/20 transition-colors">
                            <h2 className="text-xs font-medium tracking-widest uppercase text-foreground-muted mb-8">Usage Limits</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Memories */}
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-light">{user?.memoriesStored || 0}</span>
                                            <span className="text-sm text-foreground-muted">/ {formatLimit(limits.memories as number)}</span>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-foreground/10">
                                        <div
                                            className="h-full bg-[#c084fc]"
                                            style={{ width: `${Math.min(((user?.memoriesStored || 0) / (typeof limits.memories === 'number' ? limits.memories : 10000)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-3">
                                        <p className="text-xs text-foreground-muted uppercase tracking-wider">Memories Stored</p>
                                        {(user?.extraMemories || 0) > 0 && (
                                            <p className="text-[10px] text-[#4ade80] font-medium">+ {user?.extraMemories} Bonus</p>
                                        )}
                                    </div>
                                </div>
                                {/* Searches */}
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-light">{user?.searchesMade || 0}</span>
                                            <span className="text-sm text-foreground-muted">/ {formatLimit(limits.searches as number)}</span>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-foreground/10">
                                        <div
                                            className="h-full bg-[#60a5fa]"
                                            style={{ width: `${Math.min(((user?.searchesMade || 0) / (typeof limits.searches === 'number' ? limits.searches : 10000)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-3">
                                        <p className="text-xs text-foreground-muted uppercase tracking-wider">Searches Made</p>
                                        {(user?.extraSearches || 0) > 0 && (
                                            <p className="text-[10px] text-[#4ade80] font-medium">+ {user?.extraSearches} Bonus</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Redeem Coupon Section */}
                    <div className="border border-foreground/10 p-10 bg-background hover:border-foreground/20 transition-colors group">
                        <div className="max-w-xl">
                            <h2 className="text-xs font-medium tracking-widest uppercase text-foreground-muted mb-6 group-hover:text-foreground transition-colors">Redeem Coupon</h2>

                            <div className="relative">
                                <div className="flex items-center border-b border-foreground/20 focus-within:border-foreground transition-colors pb-1">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="ENTER CODE"
                                        className="flex-1 px-2 py-3 bg-transparent outline-none text-2xl font-light placeholder:text-foreground-muted/20 uppercase tracking-widest"
                                    />
                                    <button
                                        onClick={handleRedeem}
                                        disabled={loading || !couponCode.trim()}
                                        className="px-6 py-2 ml-4 text-xs font-medium border border-foreground/10 uppercase tracking-widest hover:bg-foreground hover:text-background disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground transition-all"
                                    >
                                        {loading ? "PROCESSING" : "REDEEM"}
                                    </button>
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
