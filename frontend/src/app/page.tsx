import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, DollarSign, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Aegis Finance
          </h1>
          <p className="text-xl text-neutral-400 mb-12">
            Supply Chain Finance on Arc Blockchain
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Choose Your Role
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Supplier Card */}
            <Link href="/supplier" className="block group">
              <Card className="h-full hover:border-neutral-600 transition-all duration-200 cursor-pointer">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-neutral-700 transition-colors">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl mb-2">Supplier</CardTitle>
                  <CardDescription className="text-neutral-400">
                    Upload invoices and get instant financing offers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-neutral-500 mb-6">
                    <p>✓ Upload invoices</p>
                    <p>✓ View financing offers</p>
                    <p>✓ Get paid early</p>
                  </div>
                  <Button className="w-full gap-2 group-hover:gap-3 transition-all">
                    Enter Portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Buyer Card */}
            <Link href="/buyer" className="block group">
              <Card className="h-full hover:border-neutral-600 transition-all duration-200 cursor-pointer">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-neutral-700 transition-colors">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl mb-2">Buyer</CardTitle>
                  <CardDescription className="text-neutral-400">
                    Approve invoices and manage repayments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-neutral-500 mb-6">
                    <p>✓ Approve invoices</p>
                    <p>✓ Track repayments</p>
                    <p>✓ Manage financing</p>
                  </div>
                  <Button className="w-full gap-2 group-hover:gap-3 transition-all">
                    Enter Portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* LP Card */}
            <Link href="/lp" className="block group">
              <Card className="h-full hover:border-neutral-600 transition-all duration-200 cursor-pointer">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-neutral-700 transition-colors">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl mb-2">Liquidity Provider</CardTitle>
                  <CardDescription className="text-neutral-400">
                    Deposit USDC and earn interest from financing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-neutral-500 mb-6">
                    <p>✓ Deposit USDC</p>
                    <p>✓ Earn 90% interest</p>
                    <p>✓ Withdraw anytime</p>
                  </div>
                  <Button className="w-full gap-2 group-hover:gap-3 transition-all">
                    Enter Portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Platform Info */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-center">How Aegis Finance Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    1
                  </div>
                  <h3 className="font-semibold mb-2 text-white">Supplier Uploads</h3>
                  <p className="text-sm text-neutral-400">
                    Supplier uploads invoice and buyer approves
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    2
                  </div>
                  <h3 className="font-semibold mb-2 text-white">Get Financed</h3>
                  <p className="text-sm text-neutral-400">
                    Supplier accepts offer and receives USDC instantly
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    3
                  </div>
                  <h3 className="font-semibold mb-2 text-white">Buyer Repays</h3>
                  <p className="text-sm text-neutral-400">
                    Buyer repays on due date, LPs earn interest
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Arc Benefits - Simplified */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className="text-neutral-500 text-sm">
            Built on Arc Blockchain • Native USDC • No ETH needed for gas
          </p>
        </div>
      </div>
    </div>
  );
}
