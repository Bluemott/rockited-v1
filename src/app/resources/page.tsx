import ResourcesClient from './ResourcesClient';
import { getAllPosts, getAllCategories, getAllTags } from '@/lib/blog';

export default async function ResourcesPage() {
  const posts = await getAllPosts();
  const categories = await getAllCategories();
  const tags = await getAllTags();

  return (
    <ResourcesClient
      initialPosts={posts}
      categories={categories}
      tags={tags}
    />
  );
}
