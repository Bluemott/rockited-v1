"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Search, Phone, Mail, ExternalLink, Filter, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MotionDiv } from "@/components/ui/motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  recoveryResources,
  resourceCategories,
  type RecoveryResource,
  type ResourceCategory,
} from "@/lib/recoveryResources";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { BlogPost } from "@/lib/types";

interface ResourcesClientProps {
  initialPosts: BlogPost[];
  categories: string[];
  tags: string[];
}

export default function ResourcesClient({ initialPosts, categories, tags }: ResourcesClientProps) {
  const [activeTab, setActiveTab] = useState("resources");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<ResourceCategory[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const [filteredBlogPosts, setFilteredBlogPosts] = useState<BlogPost[]>(initialPosts);

  // Filter resources based on search and categories
  const filteredResources = useMemo(() => {
    let filtered = recoveryResources;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((resource) => {
        const nameMatch = resource.name.toLowerCase().includes(query);
        const descMatch = resource.description.toLowerCase().includes(query);
        const categoryMatch = resource.category.toLowerCase().includes(query);
        return nameMatch || descMatch || categoryMatch;
      });
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((resource) => selectedCategories.includes(resource.category));
    }

    return filtered;
  }, [searchQuery, selectedCategories]);

  const handleCategoryToggle = (category: ResourceCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
  };

  const activeFilterCount = selectedCategories.length + (searchQuery.trim() ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <MotionDiv variant="fadeInUp" className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Resources & Blog</h1>
        <p className="text-lg text-muted-foreground">
          Find support groups, treatment centers, helplines, and read recovery-related articles.
        </p>
      </MotionDiv>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="resources" className="gap-2">
            <Phone className="h-4 w-4" />
            Recovery Resources
          </TabsTrigger>
          <TabsTrigger value="blog" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Blog Articles
          </TabsTrigger>
        </TabsList>

        {/* Recovery Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          {/* Search and Filter Bar */}
          <MotionDiv variant="fadeInUp" delay={0.1}>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search resources by name, description, or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Filter Toggle and Active Filters */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""}{" "}
                      found
                    </p>
                  </div>

                  {/* Category Filters */}
                  {showFilters && (
                    <div className="pt-4 border-t">
                      <Label className="text-sm font-medium mb-3 block">Filter by Category</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {resourceCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={category}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={() => handleCategoryToggle(category)}
                            />
                            <Label
                              htmlFor={category}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Category Badges */}
                  {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedCategories.map((category) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleCategoryToggle(category)}
                        >
                          {category} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          {/* Resources Grid */}
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource, index) => (
                <MotionDiv key={resource.id} variant="fadeInUp" delay={0.1 + index * 0.05}>
                  <ResourceCard resource={resource} />
                </MotionDiv>
              ))}
            </div>
          ) : (
            <MotionDiv variant="fadeInUp" delay={0.2}>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground mb-4">
                      No resources found matching your search criteria.
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          )}
        </TabsContent>

        {/* Blog Articles Tab */}
        <TabsContent value="blog" className="space-y-6">
          <BlogFilters
            posts={initialPosts}
            onFilterChange={setFilteredBlogPosts}
            categories={categories}
            tags={tags}
          />

          {filteredBlogPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogPosts.map((post, index) => (
                <MotionDiv key={post.id} variant="fadeInUp" delay={0.1 + index * 0.05}>
                  <BlogCard post={post} />
                </MotionDiv>
              ))}
            </div>
          ) : (
            <MotionDiv variant="fadeInUp" delay={0.2}>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground mb-4">
                      No articles found matching your search criteria.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResourceCard({ resource }: { resource: RecoveryResource }) {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className="pt-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-foreground pr-2">{resource.name}</h3>
          <Badge variant="outline" className="shrink-0">
            {resource.category}
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm mb-4 flex-1">{resource.description}</p>

        <div className="space-y-2 pt-4 border-t">
          {resource.phone && (
            <a
              href={`tel:${resource.phone.replace(/\D/g, "")}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>{resource.phone}</span>
            </a>
          )}

          {resource.email && (
            <a
              href={`mailto:${resource.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>{resource.email}</span>
            </a>
          )}

          {resource.website && (
            <a
              href={resource.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Visit Website</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
