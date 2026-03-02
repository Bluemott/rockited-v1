import { Mail, Phone, Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { generateContactMetadata } from "@/lib/seo";

export const metadata: Metadata = generateContactMetadata();

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <MotionDiv variant="fadeInUp" className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground">
          Get in touch with our team. We&apos;re here to help with any questions or concerns.
        </p>
      </MotionDiv>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Email</h3>
                  <p className="text-muted-foreground mb-1">support@rockited.com</p>
                  <p className="text-sm text-muted-foreground">24/7 response within 24 hours</p>
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
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Phone</h3>
                  <p className="text-muted-foreground mb-1">(555) 123-4567</p>
                  <p className="text-sm text-muted-foreground">Monday-Friday, 9 AM - 6 PM EST</p>
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
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Business Hours</h3>
                  <p className="text-muted-foreground mb-1">Monday - Friday</p>
                  <p className="text-sm text-muted-foreground">9:00 AM - 6:00 PM EST</p>
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
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Location</h3>
                  <p className="text-muted-foreground mb-1">United States</p>
                  <p className="text-sm text-muted-foreground">Online retailer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      </div>

      <MotionDiv variant="fadeInUp" delay={0.5}>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Send us a Message</h2>
            <p className="text-muted-foreground mb-6">
              Fill out the form below and we&apos;ll get back to you as soon as possible.
            </p>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Send Message
              </button>
            </form>
          </CardContent>
        </Card>
      </MotionDiv>
    </div>
  );
}
