import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { FileCheck } from "lucide-react";
import { generateTermsMetadata } from "@/lib/seo";

export const metadata: Metadata = generateTermsMetadata();

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <MotionDiv variant="fadeInUp" className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <FileCheck className="h-8 w-8 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Terms of Service</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </MotionDiv>

      <div className="space-y-6">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Agreement to Terms</h2>
                <p className="text-muted-foreground mb-4">
                  By accessing or using the ROCK IT ED website and services, you agree to be bound
                  by these Terms of Service and all applicable laws and regulations. If you do not
                  agree with any of these terms, you are prohibited from using or accessing this
                  site.
                </p>
                <p className="text-muted-foreground">
                  The materials contained in this website are protected by applicable copyright and
                  trademark law.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.2}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Use License</h2>
                <p className="text-muted-foreground mb-4">
                  Permission is granted to temporarily download one copy of the materials on ROCK IT
                  ED's website for personal, non-commercial transitory viewing only. This is the
                  grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the website</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>
                    Transfer the materials to another person or "mirror" the materials on any other
                    server
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.3}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Product Information</h2>
                <p className="text-muted-foreground mb-4">
                  We strive to provide accurate product descriptions, images, and pricing
                  information. However, we do not warrant that product descriptions or other content
                  on this site is accurate, complete, reliable, current, or error-free.
                </p>
                <p className="text-muted-foreground">
                  If a product offered by us is not as described, your sole remedy is to return it
                  in unused condition in accordance with our return policy.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.4}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Pricing and Payment</h2>
                <p className="text-muted-foreground mb-4">
                  All prices are displayed in the currency specified on the website and are subject
                  to change without notice. We reserve the right to refuse or cancel any order at
                  any time for reasons including but not limited to:
                </p>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Product availability</li>
                  <li>Errors in pricing or product information</li>
                  <li>Fraud or unauthorized or illegal transaction</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Payment must be received before we ship your order. We accept various payment
                  methods as displayed during checkout.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.5}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Shipping and Delivery
                </h2>
                <p className="text-muted-foreground">
                  We will make every effort to ship your order within the timeframe specified.
                  However, shipping times are estimates and not guaranteed. We are not responsible
                  for delays caused by shipping carriers or other factors beyond our control. Please
                  refer to our Shipping Information page for more details.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.6}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-muted-foreground mb-4">
                  In no event shall ROCK IT ED or its suppliers be liable for any damages
                  (including, without limitation, damages for loss of data or profit, or due to
                  business interruption) arising out of the use or inability to use the materials on
                  ROCK IT ED's website, even if ROCK IT ED or a ROCK IT ED authorized representative
                  has been notified orally or in writing of the possibility of such damage.
                </p>
                <p className="text-muted-foreground">
                  Because some jurisdictions do not allow limitations on implied warranties, or
                  limitations of liability for consequential or incidental damages, these
                  limitations may not apply to you.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.7}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Revisions and Errata
                </h2>
                <p className="text-muted-foreground">
                  The materials appearing on ROCK IT ED's website could include technical,
                  typographical, or photographic errors. ROCK IT ED does not warrant that any of the
                  materials on its website are accurate, complete, or current. ROCK IT ED may make
                  changes to the materials contained on its website at any time without notice.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.8}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Governing Law</h2>
                <p className="text-muted-foreground">
                  These terms and conditions are governed by and construed in accordance with the
                  laws of the United States, and you irrevocably submit to the exclusive
                  jurisdiction of the courts in that location.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.9}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Questions About Terms?
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please contact us.
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
