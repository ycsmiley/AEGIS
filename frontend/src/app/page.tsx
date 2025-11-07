import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, DollarSign, Zap, Shield, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-black">
            Aegis Finance
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Arc-Native Supply Chain Finance Platform
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Unlock instant liquidity for your invoices with AI-powered dynamic pricing.
            Built on Arc blockchain - where USDC is native.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/supplier">
              <Button size="lg" className="gap-2">
                <Package className="h-5 w-5" />
                Supplier Portal
              </Button>
            </Link>
            <Link href="/buyer">
              <Button size="lg" variant="outline" className="gap-2">
                <Building2 className="h-5 w-5" />
                Buyer Portal
              </Button>
            </Link>
            <Link href="/lp">
              <Button size="lg" variant="outline" className="gap-2">
                <DollarSign className="h-5 w-5" />
                LP Portal
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-black" />
              <CardTitle>Instant Financing</CardTitle>
              <CardDescription>
                Get paid immediately for approved invoices. No waiting for payment terms.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 mb-2 text-black" />
              <CardTitle>AI Dynamic Pricing</CardTitle>
              <CardDescription>
                Aegis AI analyzes risk factors in real-time to offer optimal financing rates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-2 text-black" />
              <CardTitle>Arc Native USDC</CardTitle>
              <CardDescription>
                No ETH needed for gas. All transactions use USDC - simple and transparent.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: "1", title: "Upload Invoice", desc: "Supplier uploads invoice details" },
              { step: "2", title: "Buyer Approves", desc: "Buyer confirms invoice validity" },
              { step: "3", title: "AI Pricing", desc: "Aegis calculates optimal rate" },
              { step: "4", title: "Accept Offer", desc: "Supplier accepts financing" },
              { step: "5", title: "Get Paid", desc: "USDC transferred instantly" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Arc Benefits */}
        <Card className="bg-black text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Why Arc Chain?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">✅ Single Currency</h4>
                <p className="text-neutral-300">Users only need USDC - no ETH required for gas</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">✅ No Approve Needed</h4>
                <p className="text-neutral-300">Native token transfers without ERC20 approvals</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">✅ Transparent Costs</h4>
                <p className="text-neutral-300">Gas and payments both in USDC - clear pricing</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">✅ Lower Barrier</h4>
                <p className="text-neutral-300">Perfect for Web2 users entering DeFi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

