import ResourcesClient from './ResourcesClient';
import { getAllPosts, getAllCategories, getAllTags } from '@/lib/blog';

export default function ResourcesPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();

  return (
    <ResourcesClient
      initialPosts={posts}
      categories={categories}
      tags={tags}
    />
  );
}
