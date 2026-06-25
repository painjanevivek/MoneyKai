import { type ReactNode } from 'react';
import { Skeleton, configureBoneyard } from 'boneyard-js/react';
import type { ResponsiveBones } from 'boneyard-js';

configureBoneyard({
  animate: 'shimmer',
  color: '#E8EEF2',
  shimmerColor: '#F7FAFC',
  darkColor: '#1E2C34',
  darkShimmerColor: '#2B3E49',
  speed: '1.6s',
  shimmerAngle: 105,
});

const websiteShellBones: ResponsiveBones = {
  breakpoints: {
    390: {
      name: 'moneykai-website-shell',
      viewportWidth: 390,
      width: 390,
      height: 860,
      bones: [
        [18, 16, 38, 38, 10],
        [68, 18, 132, 14, 7],
        [68, 40, 92, 10, 5],
        [330, 18, 42, 34, 17],
        [24, 92, 148, 22, 11],
        [24, 132, 328, 42, 14],
        [24, 184, 286, 22, 11],
        [24, 216, 318, 18, 9],
        [24, 260, 210, 52, 26],
        [18, 354, 354, 176, 22, true],
        [42, 382, 148, 18, 9],
        [42, 416, 270, 12, 6],
        [42, 444, 210, 12, 6],
        [42, 484, 296, 20, 10],
        [18, 554, 354, 118, 18, true],
        [42, 582, 226, 16, 8],
        [42, 616, 288, 12, 6],
        [42, 644, 174, 12, 6],
        [18, 696, 354, 118, 18, true],
        [42, 724, 198, 16, 8],
        [42, 758, 286, 12, 6],
        [42, 786, 224, 12, 6],
      ],
    },
    768: {
      name: 'moneykai-website-shell',
      viewportWidth: 768,
      width: 768,
      height: 900,
      bones: [
        [40, 20, 40, 40, 10],
        [96, 22, 150, 16, 8],
        [286, 24, 54, 14, 7],
        [366, 24, 54, 14, 7],
        [446, 24, 54, 14, 7],
        [556, 18, 154, 42, 21],
        [48, 108, 156, 24, 12],
        [48, 152, 430, 52, 16],
        [48, 222, 488, 20, 10],
        [48, 256, 390, 18, 9],
        [48, 310, 220, 54, 27],
        [48, 424, 672, 188, 24, true],
        [78, 456, 180, 20, 10],
        [78, 498, 350, 14, 7],
        [78, 530, 486, 14, 7],
        [78, 570, 584, 18, 9],
        [48, 648, 320, 154, 20, true],
        [78, 680, 170, 18, 9],
        [78, 724, 230, 12, 6],
        [400, 648, 320, 154, 20, true],
        [430, 680, 188, 18, 9],
        [430, 724, 238, 12, 6],
      ],
    },
    1280: {
      name: 'moneykai-website-shell',
      viewportWidth: 1280,
      width: 1280,
      height: 900,
      bones: [
        [64, 22, 40, 40, 10],
        [120, 24, 148, 16, 8],
        [426, 28, 58, 14, 7],
        [516, 28, 58, 14, 7],
        [606, 28, 58, 14, 7],
        [696, 28, 58, 14, 7],
        [786, 28, 58, 14, 7],
        [930, 18, 154, 44, 22],
        [1100, 18, 116, 44, 22],
        [80, 136, 168, 26, 13],
        [80, 184, 520, 58, 18],
        [80, 260, 450, 22, 11],
        [80, 296, 510, 20, 10],
        [80, 354, 220, 56, 28],
        [720, 130, 480, 420, 28, true],
        [756, 168, 180, 20, 10],
        [756, 216, 342, 14, 7],
        [756, 254, 284, 14, 7],
        [756, 304, 390, 22, 11],
        [756, 358, 330, 16, 8],
        [756, 402, 374, 16, 8],
        [80, 610, 350, 166, 22, true],
        [112, 644, 188, 18, 9],
        [112, 690, 246, 12, 6],
        [466, 610, 350, 166, 22, true],
        [498, 644, 202, 18, 9],
        [498, 690, 256, 12, 6],
        [852, 610, 350, 166, 22, true],
        [884, 644, 196, 18, 9],
        [884, 690, 248, 12, 6],
      ],
    },
  },
};

function WebsiteSkeletonFallback() {
  return <div aria-hidden="true" className="moneykai-boneyard-fallback" />;
}

export function WebsiteSkeleton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <Skeleton
      name="moneykai-website-shell"
      loading={loading}
      initialBones={websiteShellBones}
      transition={240}
      stagger={45}
      className="moneykai-boneyard-shell"
      fallback={<WebsiteSkeletonFallback />}
    >
      {children}
    </Skeleton>
  );
}
