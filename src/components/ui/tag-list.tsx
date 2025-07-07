import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

interface TagListProps {
  tags: string[];
  className?: string;
  badgeClassName?: string;
}

const TagList: React.FC<TagListProps> = ({ tags, className, badgeClassName }) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag, index) => (
        <Badge key={index} variant="glass" className={cn("text-sm", badgeClassName)}>
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export { TagList }; 