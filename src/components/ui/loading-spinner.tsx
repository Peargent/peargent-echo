
export function LoadingSpinner({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-[#4ade80]/20 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-[#4ade80] rounded-full border-t-transparent animate-spin"></div>
            </div>
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="min-h-full flex items-center justify-center p-8">
            <LoadingSpinner />
        </div>
    );
}
