import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { MotionDiv } from '@/components/ui/motion';
import { Mail, Phone, MessageCircle, HelpCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { generateCustomerServiceMetadata } from '@/lib/seo';

export const metadata: Metadata = generateCustomerServiceMetadata();

export default function CustomerServicePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <MotionDiv variant="fadeInUp" className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Customer Service
        </h1>
        <p className="text-lg text-muted-foreground">
          We're committed to providing exceptional customer service. Here's how we can help you.
        </p>
      </MotionDiv>

      <div className="space-y-6">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  How Can We Help?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our dedicated customer service team is available through multiple channels to assist 
                  you with any questions, concerns, or issues you may have. Whether you need help 
                  with product selection, order tracking, returns, or general inquiries, we're here 
                  to provide exceptional service and resolve any issues quickly and efficiently.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MotionDiv variant="fadeInUp" delay={0.2}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Email Support</h3>
                    <p className="text-muted-foreground mb-2">support@rockited.com</p>
                    <p className="text-sm text-muted-foreground">
                      24/7 response within 24 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv variant="fadeInUp" delay={0.3}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Phone Support</h3>
                    <p className="text-muted-foreground mb-2">(555) 123-4567</p>
                    <p className="text-sm text-muted-foreground">
                      Monday-Friday, 9 AM - 6 PM EST
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv variant="fadeInUp" delay={0.4}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Live Chat</h3>
                    <p className="text-muted-foreground mb-2">Available on website</p>
                    <p className="text-sm text-muted-foreground">
                      Monday-Friday, 9 AM - 6 PM EST
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv variant="fadeInUp" delay={0.5}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <HelpCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Help Center</h3>
                    <p className="text-muted-foreground mb-2">Comprehensive guides</p>
                    <p className="text-sm text-muted-foreground">
                      <Link href="/about/faq" className="text-primary hover:underline">
                        Visit FAQ
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>
        </div>

        <MotionDiv variant="fadeInUp" delay={0.6}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Common Topics
                </h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <Link href="/about/shipping" className="text-primary hover:underline">
                      Shipping Information
                    </Link>
                    {' '}- Track orders, shipping options, and delivery times
                  </li>
                  <li>
                    <Link href="/about/returns" className="text-primary hover:underline">
                      Returns & Refunds
                    </Link>
                    {' '}- Learn about our return policy and process
                  </li>
                  <li>
                    <Link href="/about/faq" className="text-primary hover:underline">
                      Frequently Asked Questions
                    </Link>
                    {' '}- Find answers to common questions
                  </li>
                  <li>
                    <Link href="/about/contact" className="text-primary hover:underline">
                      Contact Us
                    </Link>
                    {' '}- Get in touch with our team
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.7}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Clock className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Response Times
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    We aim to respond to all inquiries as quickly as possible:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Email: Within 24 hours</li>
                    <li>Phone: Immediate during business hours</li>
                    <li>Live Chat: Real-time during business hours</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      </div>
    </div>
  );
}

