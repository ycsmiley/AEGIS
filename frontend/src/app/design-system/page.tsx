import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { DollarSign, TrendingUp, Users, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Design System</h1>
          <p className="text-neutral-400">Aegis Finance - Black Theme Components</p>
        </div>

        {/* Colors Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Color Palette</h2>
          <div className="grid grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="h-20 w-full bg-black border border-neutral-700 rounded-lg"></div>
              <p className="text-xs text-neutral-400">Black #000000</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-neutral-900 rounded-lg"></div>
              <p className="text-xs text-neutral-400">Neutral 900</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-neutral-800 rounded-lg"></div>
              <p className="text-xs text-neutral-400">Neutral 800</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-neutral-700 rounded-lg"></div>
              <p className="text-xs text-neutral-400">Neutral 700</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-neutral-400 rounded-lg"></div>
              <p className="text-xs text-neutral-400">Neutral 400</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-white rounded-lg"></div>
              <p className="text-xs text-neutral-400">White #FFFFFF</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <div className="h-20 w-full bg-green-600 rounded-lg"></div>
              <p className="text-xs text-neutral-400">Success Green</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-red-600 rounded-lg"></div>
              <p className="text-xs text-neutral-400">Error Red</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-yellow-600 rounded-lg"></div>
              <p className="text-xs text-neutral-400">Warning Yellow</p>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Typography</h2>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <h1 className="text-5xl font-bold text-white">Heading 1</h1>
                <p className="text-sm text-neutral-500 mt-1">text-5xl font-bold</p>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-white">Heading 2</h2>
                <p className="text-sm text-neutral-500 mt-1">text-4xl font-bold</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Heading 3</h3>
                <p className="text-sm text-neutral-500 mt-1">text-2xl font-semibold</p>
              </div>
              <div>
                <p className="text-base text-white">Body Text - This is regular body text</p>
                <p className="text-sm text-neutral-500 mt-1">text-base</p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Secondary Text - This is secondary text</p>
                <p className="text-sm text-neutral-500 mt-1">text-sm text-neutral-400</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Buttons</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-neutral-400 mb-3">Primary (Default)</p>
                  <div className="flex gap-3">
                    <Button size="sm">Small Button</Button>
                    <Button>Default Button</Button>
                    <Button size="lg">Large Button</Button>
                    <Button disabled>Disabled</Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-3">Outline</p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">Small</Button>
                    <Button variant="outline">Default</Button>
                    <Button variant="outline" size="lg">Large</Button>
                    <Button variant="outline" disabled>Disabled</Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-3">Secondary</p>
                  <div className="flex gap-3">
                    <Button variant="secondary" size="sm">Small</Button>
                    <Button variant="secondary">Default</Button>
                    <Button variant="secondary" size="lg">Large</Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-3">Ghost</p>
                  <div className="flex gap-3">
                    <Button variant="ghost" size="sm">Small</Button>
                    <Button variant="ghost">Default</Button>
                    <Button variant="ghost" size="lg">Large</Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-3">Destructive</p>
                  <div className="flex gap-3">
                    <Button variant="destructive" size="sm">Small</Button>
                    <Button variant="destructive">Default</Button>
                    <Button variant="destructive" size="lg">Large</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Badges</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Success
                </Badge>
                <Badge variant="error">
                  <XCircle className="h-3 w-3 mr-1" />
                  Error
                </Badge>
                <Badge variant="warning">
                  <Clock className="h-3 w-3 mr-1" />
                  Warning
                </Badge>
                <Badge variant="pending">Pending</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Stat
              label="Total Volume"
              value="$1,234,567"
              icon={DollarSign}
              trend={{ value: 12.5, isPositive: true }}
              description="Last 30 days"
            />
            <Stat
              label="Active Invoices"
              value="42"
              icon={FileText}
              description="Currently processing"
            />
            <Stat
              label="Average APR"
              value="8.2%"
              icon={TrendingUp}
              trend={{ value: 0.5, isPositive: false }}
              description="Across all invoices"
            />
            <Stat
              label="Total Users"
              value="156"
              icon={Users}
              trend={{ value: 23.1, isPositive: true }}
              description="Growth this month"
            />
          </div>
        </section>

        {/* Cards Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>This is a standard card with header and description</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300">Card content goes here. This is the main body of the card where you can place any content.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Card with Badge</CardTitle>
                  <Badge variant="success">Active</Badge>
                </div>
                <CardDescription>Example of a card with status badge</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">Invoice #12345</p>
                  <p className="text-2xl font-bold text-white">$50,000 USDC</p>
                  <p className="text-sm text-neutral-500">Due in 30 days</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Combined Example */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Complete Example</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice #INV-2024-001</CardTitle>
                  <CardDescription>Supplier: Acme Corp • Buyer: BigCo Industries</CardDescription>
                </div>
                <Badge variant="success">Approved</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Invoice Amount</p>
                  <p className="text-2xl font-bold text-white">$100,000</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Financing Amount</p>
                  <p className="text-2xl font-bold text-white">$95,000</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">APR Rate</p>
                  <p className="text-2xl font-bold text-green-400">7.2%</p>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-neutral-400">Payment Terms</p>
                  <p className="text-sm text-white">Net 60 days</p>
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1">Accept Offer</Button>
                  <Button variant="outline">View Details</Button>
                  <Button variant="ghost" size="icon">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
