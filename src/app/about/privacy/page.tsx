import { Shield } from "lucide-react";
import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { generatePrivacyMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePrivacyMetadata();

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <MotionDiv variant="fadeInUp" className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Privacy Policy</h1>
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
                <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  At ROCK IT ED, we are committed to protecting your privacy. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your information when you
                  visit our website and use our services.
                </p>
                <p className="text-muted-foreground">
                  Please read this privacy policy carefully. If you do not agree with the terms of
                  this privacy policy, please do not access or use our services.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.2}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Information We Collect
                </h2>
                <h3 className="text-xl font-semibold text-foreground mb-2">Personal Information</h3>
                <p className="text-muted-foreground mb-4">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside mb-4">
                  <li>Register for an account</li>
                  <li>Make a purchase</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Contact us for customer support</li>
                  <li>Participate in surveys or promotions</li>
                </ul>
                <p className="text-muted-foreground">
                  This information may include your name, email address, phone number, shipping
                  address, billing address, payment information, and other details you choose to
                  provide.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.3}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  How We Use Your Information
                </h2>
                <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Process and fulfill your orders</li>
                  <li>Send you order confirmations and updates</li>
                  <li>Respond to your customer service requests</li>
                  <li>Send you marketing communications (with your consent)</li>
                  <li>Improve our website and services</li>
                  <li>Detect and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.4}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Information Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                  <li>
                    Service providers who assist us in operating our website and conducting our
                    business
                  </li>
                  <li>Payment processors to handle transactions</li>
                  <li>Shipping companies to deliver your orders</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.5}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational security measures to protect
                  your personal information. However, no method of transmission over the internet or
                  electronic storage is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.6}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
                <p className="text-muted-foreground mb-4">You have the right to:</p>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Request a copy of your data</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To exercise these rights, please contact us at support@rockited.com.
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
                  Cookies and Tracking
                </h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to track activity on our website
                  and store certain information. You can instruct your browser to refuse all cookies
                  or to indicate when a cookie is being sent. However, if you do not accept cookies,
                  you may not be able to use some portions of our website.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.8}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Changes to This Policy
                </h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any
                  changes by posting the new Privacy Policy on this page and updating the &quot;Last
                  updated&quot; date. You are advised to review this Privacy Policy periodically for any
                  changes.
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
                  Questions About Privacy?
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy, please contact us.
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
