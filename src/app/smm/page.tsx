

import { PageHeader } from "@/components/page-header";
import { getAllSocialPosts, getCampaigns, getAllActions } from "@/lib/data";
import { SmmPlanner } from "./smm-planner";
import { AddSmmPostButton } from "./add-smm-post-button";

type SmmPageProps = {
    searchParams: {
        status?: 'draft' | 'ready' | 'published';
        startDate?: string;
        endDate?: string;
    }
}

export default async function SmmPage({ searchParams: searchParamsPromise }: SmmPageProps) {
  const searchParams = await searchParamsPromise;
  const allPosts = await getAllSocialPosts();
  const allCampaigns = await getCampaigns();
  const allActions = await getAllActions();
  
  const filteredPosts = allPosts.filter(post => {
      if (searchParams.status && post.status !== searchParams.status) {
          return false;
      }
      if (searchParams.startDate) {
          const postDate = new Date(post.publicationDate);
          const filterDate = new Date(searchParams.startDate);
          if (postDate < filterDate) return false;
      }
      if (searchParams.endDate) {
          const postDate = new Date(post.publicationDate);
          const filterDate = new Date(searchParams.endDate);
          if (postDate > filterDate) return false;
      }
      return true;
  });

  return (
    <div>
      <PageHeader
        title="SMM Планировщик"
        description="Управляйте всеми вашими публикациями в социальных сетях в одном месте."
      >
        <AddSmmPostButton campaigns={allCampaigns} actions={allActions} />
      </PageHeader>
      <SmmPlanner posts={filteredPosts} actions={allActions} />
    </div>
  );
}
