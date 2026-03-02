import { Mail, Phone, Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { generateAboutMetadata } from "@/lib/seo";

export const metadata: Metadata = generateAboutMetadata();

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <MotionDiv variant="fadeInUp" className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">About ROCK IT ED</h1>
        <p className="text-lg text-muted-foreground">
          Learn more about our mission, values, and commitment to excellence.
        </p>
      </MotionDiv>

      <div className="space-y-8">
        {/* Main Content Section */}
        <MotionDiv variant="fadeInUp" delay={0.2}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Our Story</h2>
                <p className="text-muted-foreground mb-4">
                  Welcome to ROCK IT ED, where quality meets innovation. We are dedicated to
                  providing premium products that enhance your daily life. Our journey began with a
                  simple mission: to deliver exceptional quality and outstanding customer service.
                </p>
                <p className="text-muted-foreground mb-4">
                  Every product in our collection is carefully selected and tested to meet our high
                  standards of quality and durability. We partner only with trusted manufacturers
                  who share our values and commitment to excellence.
                </p>
                <p className="text-muted-foreground">
                  At ROCK IT ED, we believe that great products should be accessible to everyone.
                  That&apos;s why we work tirelessly to bring you the best value without compromising on
                  quality.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        {/* Image Section */}
        <MotionDiv variant="fadeInUp" delay={0.3}>
          <Card>
            <CardContent className="pt-6">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
                <Image
                  src="/Rockited4D_New_Hero_Image.webp"
                  alt="ROCK IT ED - Premium Products"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Our commitment to quality and innovation
              </p>
            </CardContent>
          </Card>
        </MotionDiv>

        {/* Values Section */}
        <MotionDiv variant="fadeInUp" delay={0.4}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Our Values</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="font-semibold text-foreground mr-2">Quality First:</span>
                    We never compromise on quality. Every product undergoes rigorous testing to
                    ensure it meets our standards.
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-foreground mr-2">Customer Focus:</span>
                    Your satisfaction is our priority. We&apos;re here to help with any questions or
                    concerns.
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-foreground mr-2">Innovation:</span>
                    We continuously seek out new and improved products to enhance your experience.
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-foreground mr-2">Integrity:</span>
                    We conduct business with honesty, transparency, and respect for our customers
                    and partners.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        {/* Additional Image Section */}
        <MotionDiv variant="fadeInUp" delay={0.5}>
          <Card>
            <CardContent className="pt-6">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
                <Image
                  src="/Bedevilment.webp.webp"
                  alt="ROCK IT ED Products"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Discover our premium product collection
              </p>
            </CardContent>
          </Card>
        </MotionDiv>

        {/* Contact Us Section */}
        <MotionDiv variant="fadeInUp" delay={0.6} id="contact">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-6">
                Get in touch with our team. We&apos;re here to help with any questions or concerns.
              </p>
            </CardContent>
          </Card>
        </MotionDiv>

        {/* Contact Info Cards */}
        <MotionDiv variant="fadeInUp" delay={0.7}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Email</h3>
                    <a
                      href="mailto:support@rockited.com"
                      className="text-muted-foreground mb-1 hover:text-primary transition-colors"
                    >
                      support@rockited.com
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      24/7 response within 24 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Phone</h3>
                    <a
                      href="tel:5551234567"
                      className="text-muted-foreground mb-1 hover:text-primary transition-colors"
                    >
                      (555) 123-4567
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      Monday-Friday, 9 AM - 6 PM EST
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
          </div>
        </MotionDiv>

        {/* Contact Form */}
        <MotionDiv variant="fadeInUp" delay={0.8}>
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
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
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
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
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
    </div>
  );
}
