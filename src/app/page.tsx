"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { ArrowRight, CheckCircle, Truck, Heart, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import FeaturedProducts from "@/components/product/FeaturedProducts";
import { WooProduct } from "@/lib/types";

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<WooProduct[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({ x, y });
      }
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (heroElement) {
        heroElement.removeEventListener("mousemove", handleMouseMove);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Fetch featured products on component mount
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch("/api/products/featured");
        if (response.ok) {
          const products = await response.json();
          setFeaturedProducts(products);
        }
      } catch (error) {
        console.error("Error fetching featured products:", error);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Image Section */}
      <section className="relative w-full overflow-hidden" aria-label="Hero image">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9]">
          <Image
            src="/Rockited4D_New_Hero_Image.webp"
            alt="ROCK IT ED - Premium Products"
            fill
            priority
            fetchPriority="high"
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </div>
      </section>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-8 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[90vh]">
            {/* Left Column - Product Image */}
            <MotionDiv
              variant="fadeInUp"
              delay={0.2}
              className="relative"
              style={{
                transform: `translateY(${scrollY * 0.5}px)`,
                transition: "transform 0.1s ease-out",
              }}
            >
              <div
                className="relative w-full max-w-2xl mx-auto lg:mx-0"
                style={{
                  transform: `perspective(1200px) rotateX(${(mousePosition.y - 0.5) * 20 + 15}deg) rotateY(${(mousePosition.x - 0.5) * 20}deg) rotateZ(${(mousePosition.x - 0.5) * 5}deg) translateZ(${Math.abs(mousePosition.x - 0.5) * 30}px)`,
                  transition: "transform 0.1s ease-out",
                }}
              >
                <div className="relative z-10">
                  <Image
                    src="/Bedevilment.webp.webp"
                    alt="Bedevilment Product"
                    width={800}
                    height={800}
                    className="w-full h-auto drop-shadow-2xl"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{
                      filter: "drop-shadow(0 35px 70px rgba(0, 0, 0, 0.4))",
                    }}
                  />
                </div>
                {/* Enhanced glow effect behind image */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-accent/30 to-accent/15 blur-3xl -z-10"
                  style={{
                    transform: `translate(${(mousePosition.x - 0.5) * 40}px, ${(mousePosition.y - 0.5) * 40}px) scale(${1 + Math.abs(mousePosition.x - 0.5) * 0.2})`,
                  }}
                />
                {/* Secondary glow layer */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-primary-foreground/20 to-accent/10 blur-2xl -z-20"
                  style={{
                    transform: `translate(${(mousePosition.x - 0.5) * -20}px, ${(mousePosition.y - 0.5) * -20}px)`,
                  }}
                />
              </div>
            </MotionDiv>

            {/* Right Column - Text Content */}
            <MotionDiv
              variant="fadeInUp"
              delay={0.4}
              className="text-center lg:text-left"
              style={{
                transform: `translateY(${scrollY * -0.3}px)`,
                transition: "transform 0.1s ease-out",
              }}
            >
              <h1 className="text-6xl md:text-7xl font-bold mb-6 text-primary drop-shadow-lg">
                Discover the
                <span className="block">Bedevilment</span>
              </h1>

              <p className="text-xl md:text-2xl text-foreground mb-8 max-w-2xl lg:mx-0 mx-auto leading-relaxed">
                Experience the extraordinary with our latest innovation. This remarkable product
                combines cutting-edge design with unparalleled functionality to deliver an
                exceptional experience that will transform your daily routine.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild>
                  <Link href="/products">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="w-full py-8 flex justify-center">
        <Separator className="w-[80%]" />
      </div>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <>
          <FeaturedProducts products={featuredProducts} />
          {/* Separator */}
          <div className="w-full py-8 flex justify-center">
            <Separator className="w-[80%]" />
          </div>
        </>
      )}

      {/* Features Section */}
      <section className="py-16 floating-content">
        <div className="container mx-auto px-4">
          <MotionDiv variant="fadeInUp" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Us?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing you with the best products and shopping experience.
            </p>
          </MotionDiv>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <StaggerItem>
              <Card
                className="text-center overflow-hidden cursor-pointer hover:shadow-brand-lg transition-all duration-300"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest("a") && !target.closest("button")) {
                    setExpandedCard(expandedCard === 0 ? null : 0);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedCard(expandedCard === 0 ? null : 0);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={expandedCard === 0}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    <Link href="/about" className="hover:text-primary transition-colors">
                      Premium Quality
                    </Link>
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Every product is carefully selected and tested to meet our high standards of
                    quality and durability.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href="/about"
                      className="text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Learn More
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCard(expandedCard === 0 ? null : 0);
                      }}
                      className="text-primary"
                      aria-label="Toggle details"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-primary transition-transform duration-300 ${
                          expandedCard === 0 ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedCard === 0 ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pt-4 border-t border-border space-y-3 text-left">
                      <p className="text-sm text-muted-foreground">
                        Our commitment to quality extends beyond initial selection. Each product
                        undergoes rigorous testing to ensure:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li>Durability testing under various conditions</li>
                        <li>Material quality verification and certification</li>
                        <li>Performance benchmarks and standards compliance</li>
                        <li>Long-term reliability assessments</li>
                      </ul>
                      <p className="text-sm text-muted-foreground pt-2">
                        We partner only with trusted manufacturers who share our values and
                        commitment to excellence.
                      </p>
                      <Link
                        href="/about"
                        className="inline-block mt-2 text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit About Page →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card
                className="text-center overflow-hidden cursor-pointer hover:shadow-brand-lg transition-all duration-300"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest("a") && !target.closest("button")) {
                    setExpandedCard(expandedCard === 1 ? null : 1);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedCard(expandedCard === 1 ? null : 1);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={expandedCard === 1}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    <Link href="/about/shipping" className="hover:text-primary transition-colors">
                      Fast Shipping
                    </Link>
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Get your orders delivered quickly and safely with our reliable shipping
                    partners.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href="/about/shipping"
                      className="text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Shipping Info
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCard(expandedCard === 1 ? null : 1);
                      }}
                      className="text-primary"
                      aria-label="Toggle details"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-primary transition-transform duration-300 ${
                          expandedCard === 1 ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedCard === 1 ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pt-4 border-t border-border space-y-3 text-left">
                      <p className="text-sm text-muted-foreground">
                        We offer multiple shipping options to meet your needs:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li>
                          <strong>Standard Shipping:</strong> 5-7 business days
                        </li>
                        <li>
                          <strong>Express Shipping:</strong> 2-3 business days
                        </li>
                        <li>
                          <strong>Overnight Delivery:</strong> Next business day (where available)
                        </li>
                        <li>
                          <strong>Free Shipping:</strong> On orders over $50
                        </li>
                      </ul>
                      <p className="text-sm text-muted-foreground pt-2">
                        All orders include real-time tracking so you can monitor your package every
                        step of the way. We work with trusted carriers to ensure safe and timely
                        delivery.
                      </p>
                      <Link
                        href="/about/shipping"
                        className="inline-block mt-2 text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Shipping Details →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card
                className="text-center overflow-hidden cursor-pointer hover:shadow-brand-lg transition-all duration-300"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest("a") && !target.closest("button")) {
                    setExpandedCard(expandedCard === 2 ? null : 2);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedCard(expandedCard === 2 ? null : 2);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={expandedCard === 2}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    <Link
                      href="/about/customer-service"
                      className="hover:text-primary transition-colors"
                    >
                      Customer Support
                    </Link>
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Our dedicated team is here to help you with any questions or concerns you may
                    have.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href="/about/customer-service"
                      className="text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Get Support
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCard(expandedCard === 2 ? null : 2);
                      }}
                      className="text-primary"
                      aria-label="Toggle details"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-primary transition-transform duration-300 ${
                          expandedCard === 2 ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedCard === 2 ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pt-4 border-t border-border space-y-3 text-left">
                      <p className="text-sm text-muted-foreground">
                        Our customer support team is available through multiple channels:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li>
                          <strong>Email Support:</strong> 24/7 response within 24 hours
                        </li>
                        <li>
                          <strong>Live Chat:</strong> Monday-Friday, 9 AM - 6 PM EST
                        </li>
                        <li>
                          <strong>Phone Support:</strong> Monday-Friday, 9 AM - 6 PM EST
                        </li>
                        <li>
                          <strong>Help Center:</strong> Comprehensive FAQ and guides
                        </li>
                      </ul>
                      <p className="text-sm text-muted-foreground pt-2">
                        Whether you need help with product selection, order tracking, returns, or
                        general inquiries, we're committed to providing exceptional service and
                        resolving any issues quickly and efficiently.
                      </p>
                      <Link
                        href="/about/customer-service"
                        className="inline-block mt-2 text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Contact Customer Service →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Separator */}
      <div className="w-full py-8 flex justify-center">
        <Separator className="w-[80%]" />
      </div>

      {/* CTA Section */}
      <section className="py-16 floating-content">
        <div className="container mx-auto px-4 text-center">
          <MotionDiv variant="fadeInUp">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Start Shopping?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Browse our collection and find the perfect products for your lifestyle.
            </p>
            <Button size="lg" asChild>
              <Link href="/products">
                Explore Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </MotionDiv>
        </div>
      </section>
    </div>
  );
}
