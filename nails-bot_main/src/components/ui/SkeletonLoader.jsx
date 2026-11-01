import React from "react";

export default function SkeletonLoader({ count = 10 }) {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="p-[6px] 
             flex flex-col gap-[10px] bg-gray rounded-[10px] 
                w-[46.2vw] h-[150px] "
          >
            <div
              className="w-full h-[89px] bg-gray_dark
             rounded-[10px] animate-pulse"
            />

            <div
              className="flex flex-col justify-between 
            h-full gap-[10px]"
            >
              <div
                className="h-6 bg-gray_dark 
              rounded animate-pulse"
              />
              <div
                className="h-6 w-1/2 bg-gray_dark 
              rounded animate-pulse"
              />
            </div>
          </div>
        ))}
    </>
  );
}

export function CartSkeletonLoader({ count = 4 }) {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div
            key={`cart-skeleton-${index}`}
            className="bg-gray rounded-[10px] p-[6px] flex gap-[10px] items-center mb-4 h-[144px] w-full max-w-[500px]"
          >
            <div className="w-[38%] h-[100px] bg-gray_dark rounded-[10px] animate-pulse" />
            <div className="w-[62%] flex flex-col justify-between h-[100px] gap-2">
              <div className="flex justify-between items-center w-full mb-1">
                <div className="pr-5 w-[70%]">
                  <div className="h-6 bg-gray_dark rounded animate-pulse w-full mb-1" />
                </div>
                <div className="h-5 w-5 bg-gray_dark rounded-full animate-pulse" />
              </div>
              <div className="h-5 bg-gray_dark rounded animate-pulse w-1/2 mb-2" />
              <div className="flex justify-between items-center gap-2 mt-auto">
                <div className="h-6 w-[77px] bg-gray_dark rounded animate-pulse" />
                <div className="h-6 w-16 bg-gray_dark rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
    </>
  );
}
