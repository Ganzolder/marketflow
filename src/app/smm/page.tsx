

import { PageHeader } from "@/components/page-header";
import { getAllSocialPosts, getCampaigns } from "@/lib/data";
import { SmmPlanner } from "./smm-planner";
import { AddSmmPostButton } from "./add-smm-post-button";
import type { SocialPostStatus } from "@/lib/types";

type SmmPageProps = {
    searchParams: {
        status?: string; // Can be a single status or comma-separated
        startDate?: string;
        endDate?: string;
        campaignId?: string;
        actionId?: string;
    }
}

export default async function SmmPage({ searchParams: searchParamsPromise }: SmmPageProps) {
  const searchParams = await searchParamsPromise;
  const allPosts = await getAllSocialPosts();
  const allCampaigns = await getCampaigns();
  
  const filteredPosts = allPosts.filter(post => {
      if (searchParams.status) {
          const statuses = searchParams.status.split(',') as SocialPostStatus[];
          if (!statuses.includes(post.status)) {
              return false;
          }
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
      if (searchParams.campaignId && post.campaignId !== searchParams.campaignId) {
          return false;
      }
      if (searchParams.actionId && post.actionId !== searchParams.actionId) {
        return false;
      }
      return true;
  });

  return (
    <div>
      <PageHeader
        title="SMM Планировщик"
        description="Управляйте всеми вашими публикациями в социальных сетях в одном месте."
      >
        <AddSmmPostButton />
      </PageHeader>
      <SmmPlanner posts={filteredPosts} campaigns={allCampaigns} />
    </div>
  );
}
