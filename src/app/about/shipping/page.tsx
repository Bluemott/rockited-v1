import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { MotionDiv } from '@/components/ui/motion';
import { Truck, Clock, Package, MapPin } from 'lucide-react';
import { generateShippingMetadata } from '@/lib/seo';

export const metadata: Metadata = generateShippingMetadata();

export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <MotionDiv variant="fadeInUp" className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Truck className="h-8 w-8 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Shipping Information
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Learn about our shipping options, delivery times, and tracking information.
        </p>
      </MotionDiv>

      <div className="space-y-6">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Shipping Options
                </h2>
                <p className="text-muted-foreground mb-4">
                  We offer multiple shipping options to meet your needs:
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Package className="h-6 w-6 text-primary mt-1 shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Standard Shipping</h3>
                      <p className="text-muted-foreground mb-2">5-7 business days</p>
                      <p className="text-sm text-muted-foreground">
                        Our standard shipping option provides reliable delivery within 5-7 business days. 
                        Perfect for non-urgent orders.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Clock className="h-6 w-6 text-primary mt-1 shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Express Shipping</h3>
                      <p className="text-muted-foreground mb-2">2-3 business days</p>
                      <p className="text-sm text-muted-foreground">
                        Need your order faster? Express shipping delivers your package within 2-3 business 
                        days. Additional fees apply.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Truck className="h-6 w-6 text-primary mt-1 shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Overnight Delivery</h3>
                      <p className="text-muted-foreground mb-2">Next business day</p>
                      <p className="text-sm text-muted-foreground">
                        For urgent orders, we offer overnight delivery (where available). Orders placed 
                        before 2 PM EST will arrive the next business day. Additional fees apply.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.2}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Free Shipping
                  </h2>
                  <p className="text-muted-foreground">
                    Enjoy free standard shipping on all orders over $50. No coupon code needed - 
                    free shipping is automatically applied at checkout for qualifying orders.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.3}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Order Processing
                </h2>
                <p className="text-muted-foreground mb-4">
                  Once you place an order, here's what happens:
                </p>
                <ol className="text-muted-foreground space-y-3 list-decimal list-inside">
                  <li><strong className="text-foreground">Order Confirmation:</strong> You'll receive an email confirmation immediately after placing your order.</li>
                  <li><strong className="text-foreground">Processing:</strong> We typically process orders within 1-2 business days.</li>
                  <li><strong className="text-foreground">Shipping Notification:</strong> Once your order ships, you'll receive an email with tracking information.</li>
                  <li><strong className="text-foreground">Delivery:</strong> Your package will arrive according to the shipping method you selected.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.4}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Tracking Your Order
                </h2>
                <p className="text-muted-foreground mb-4">
                  All orders include real-time tracking so you can monitor your package every step 
                  of the way. Once your order ships, you'll receive:
                </p>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                  <li>A tracking number via email</li>
                  <li>Real-time updates on your package's location</li>
                  <li>Estimated delivery date</li>
                  <li>Delivery confirmation</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  You can track your order using the tracking number provided in your shipping 
                  confirmation email, or by logging into your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.5}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Shipping Locations
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    We currently ship to addresses within the United States. We work with trusted 
                    carriers to ensure safe and timely delivery to all locations.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Note: Shipping times may vary based on your location. Remote or rural areas 
                    may experience slightly longer delivery times.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.6}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Delivery Issues
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you experience any issues with delivery, such as:
                </p>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside mb-4">
                  <li>Package not received within the estimated delivery window</li>
                  <li>Damaged package upon delivery</li>
                  <li>Incorrect delivery address</li>
                  <li>Missing items from your order</li>
                </ul>
                <p className="text-muted-foreground">
                  Please contact our customer service team immediately. We'll work with you and 
                  the shipping carrier to resolve the issue as quickly as possible.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.7}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Questions About Shipping?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our customer service team is here to help with any shipping questions or concerns.
                </p>
                <a
                  href="/about/contact"
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      </div>
    </div>
  );
}

