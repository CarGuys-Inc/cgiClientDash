import { redirect } from "next/navigation";

export default function OrderBump({ isChecked, allParams }) {
  
  // Define the server action
  async function toggleUpsell() {
    "use server";
    const params = new URLSearchParams(allParams);
    
    if (isChecked) {
      params.delete("upsell");
    } else {
      params.set("upsell", "true");
    }
    
    redirect(`/signup?${params.toString()}`);
  }

  return (
    <form action={toggleUpsell}>
      <label className={`relative block border-2 rounded-xl p-3 cursor-pointer transition-all group ${isChecked ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
        <div className="flex items-start gap-3">
            <div className="pt-1">
                {/* FIX 1: Removed onChange, added readOnly. 
                   The checkbox state is controlled by the URL/Parent, not local state. */}
                <input 
                    type="checkbox" 
                    checked={isChecked} 
                    readOnly 
                    className="w-5 h-5 accent-black" 
                />
                
                {/* FIX 2: Invisible submit button covers the area to trigger the form */}
                <button type="submit" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"></button>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-sm">Post a 2nd Job</span>
                    <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded">SAVE 40%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-snug">
                    Hire for another role for just <span className="font-bold text-black">$599</span> (usually $999). 30-day listing.
                </p>
            </div>
        </div>
      </label>
    </form>
  );
}