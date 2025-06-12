import {useMantineTheme} from "@mantine/core";
import React from "react";

function IconChevronLeft() {
  return (
    <svg width="9" height="13" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 1L1 5.5L5.5 10" stroke="black" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="9" height="13" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 10L5.5 5.5L1 1" stroke="black" strokeLinecap="round" />
    </svg>
  );
}

function DataSetSVG() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.33325 5C3.33325 5.66304 4.03563 6.29893 5.28587 6.76777C6.53612 7.23661 8.23181 7.5 9.99992 7.5C11.768 7.5 13.4637 7.23661 14.714 6.76777C15.9642 6.29893 16.6666 5.66304 16.6666 5C16.6666 4.33696 15.9642 3.70107 14.714 3.23223C13.4637 2.76339 11.768 2.5 9.99992 2.5C8.23181 2.5 6.53612 2.76339 5.28587 3.23223C4.03563 3.70107 3.33325 4.33696 3.33325 5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.33325 5V10C3.33325 10.663 4.03563 11.2989 5.28587 11.7678C6.53612 12.2366 8.23181 12.5 9.99992 12.5C11.768 12.5 13.4637 12.2366 14.714 11.7678C15.9642 11.2989 16.6666 10.663 16.6666 10V5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.33325 10V15C3.33325 15.663 4.03563 16.2989 5.28587 16.7678C6.53612 17.2366 8.23181 17.5 9.99992 17.5C11.768 17.5 13.4637 17.2366 14.714 16.7678C15.9642 16.2989 16.6666 15.663 16.6666 15V10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeSVG() {
  return (
    <svg width="22" height="24" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 16H5V10H11V16H14V7L8 2.5L2 7V16ZM0 18V6L8 0L16 6V18H9V12H7V18H0Z"
        fill="#545454"
      />
    </svg>
  );
}

function PlusSVG() {
  const theme = useMantineTheme();
  return (
    <svg width="35" height="37" viewBox="0 0 26 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="12" r="12" fill={theme.colors[theme.primaryColor][5]} />
      <path
        d="M18.8008 10.8477V12.8867H7.10547V10.8477H18.8008ZM14.043 5.86719V18.2891H11.875V5.86719H14.043Z"
        fill="white"
      />
    </svg>
  );
}

function StackSVG() {
  return (
    <svg
      width="15"
      height="16"
      viewBox="0 0 14 15"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14 3.38826C14 1.87066 10.7949 0.588257 7 0.588257C3.20513 0.588257 0 1.87066 0 3.38826V4.78826C0 6.30586 3.20513 7.58826 7 7.58826C10.7949 7.58826 14 6.30586 14 4.78826V3.38826ZM7 12.4883C3.20513 12.4883 0 11.2059 0 9.68826V11.7883C0 13.3059 3.20513 14.5883 7 14.5883C10.7949 14.5883 14 13.3059 14 11.7883V9.68826C14 11.2059 10.7949 12.4883 7 12.4883Z" />
      <path d="M14 6.18823C14 7.70583 10.7949 8.98823 7 8.98823C3.20513 8.98823 0 7.70583 0 6.18823V8.28823C0 9.80583 3.20513 11.0882 7 11.0882C10.7949 11.0882 14 9.80583 14 8.28823V6.18823Z" />
    </svg>
  );
}

function BarsSVG() {
  return (
    <svg
      width="15"
      height="16"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path d="M3.78947 9.6H0.631579V4.8H3.78947V9.6ZM7.57895 9.6H4.42105V2.4H7.57895V9.6ZM11.3684 9.6H8.21053V0H11.3684V9.6ZM12 12H0V10.8H12V12Z" />
    </svg>
  );
}

function EyeSVG() {
  return (
    <svg viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.44417 7L1.93128 6.51342C1.39791 6.03168 0.978845 5.43564 0.704979 4.76927C1.39648 3.03198 3.30406 1.68532 5.10945 1.68532C5.57405 1.69149 6.03444 1.77485 6.47201 1.93204L7 1.39749C6.40138 1.143 5.75929 1.008 5.10945 1C3.99914 1.042 2.9254 1.41036 2.02094 2.05954C1.11648 2.70872 0.420941 3.61027 0.0202935 4.65277C-0.00676449 4.72806 -0.00676449 4.81049 0.0202935 4.88578C0.322866 5.69344 0.810723 6.41783 1.44417 7Z"
        fill="#ADB5BD"
      />
      <path
        d="M3.79316 4.90357C3.81954 4.56133 3.97587 4.23946 4.23358 3.99682C4.49128 3.75417 4.83313 3.60698 5.19663 3.58214L5.88319 2.93214C5.49847 2.83677 5.09392 2.838 4.70987 2.93574C4.32582 3.03347 3.97569 3.22428 3.69438 3.48914C3.41308 3.75401 3.21042 4.08367 3.10662 4.44527C3.00282 4.80687 3.00151 5.18777 3.1028 5.55L3.79316 4.90357ZM10.9774 4.87857C10.5425 3.81186 9.78562 2.88822 8.80013 2.22143L10.6208 0.503571L10.086 0L0 9.49643L0.534835 10L2.46935 8.17857C3.33186 8.655 4.31056 8.91336 5.31042 8.92857C6.5468 8.8848 7.74245 8.50087 8.7496 7.82425C9.75676 7.14764 10.5313 6.20798 10.9774 5.12143C11.0075 5.04296 11.0075 4.95704 10.9774 4.87857ZM6.82769 5C6.82609 5.25004 6.75482 5.4953 6.621 5.71127C6.48718 5.92725 6.2955 6.10637 6.06511 6.23074C5.83473 6.3551 5.57371 6.42036 5.30815 6.41998C5.04258 6.4196 4.78177 6.3536 4.55179 6.22857L6.61527 4.28571C6.75164 4.50205 6.82491 4.74845 6.82769 5ZM5.31042 8.21429C4.51464 8.2012 3.73395 8.00763 3.03453 7.65L3.99799 6.74286C4.43623 7.02916 4.96735 7.16144 5.49861 7.1166C6.02988 7.07176 6.52754 6.85265 6.90471 6.49753C7.28188 6.1424 7.5146 5.67383 7.56222 5.17362C7.60984 4.67341 7.46935 4.17333 7.16528 3.76071L8.25391 2.73571C9.12429 3.29821 9.80492 4.08408 10.215 5C9.44497 6.81071 7.3208 8.21429 5.31042 8.21429Z"
        fill="#ADB5BD"
      />
    </svg>
  );
}

function SortSVG() {
  return (
    <svg viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.75 5.42156V2.50489C7.75 1.69989 8.11167 1.33823 8.91667 1.33823C9.72167 1.33823 10.0833 1.69989 10.0833 2.50489V5.42156M10.0833 3.67156H7.75"
        stroke="#ADB5BD"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.0833 11.8382H7.75L10.0833 7.75488H7.75"
        stroke="#ADB5BD"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.33334 8.33823L3.08334 10.0882L4.83334 8.33823"
        stroke="#ADB5BD"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.08334 3.08823V10.0882"
        stroke="#ADB5BD"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_905_15769)">
        <path
          d="M2.25 7.5C2.25 8.18944 2.3858 8.87213 2.64963 9.50909C2.91347 10.146 3.30018 10.7248 3.78769 11.2123C4.2752 11.6998 4.85395 12.0865 5.49091 12.3504C6.12787 12.6142 6.81056 12.75 7.5 12.75C8.18944 12.75 8.87213 12.6142 9.50909 12.3504C10.146 12.0865 10.7248 11.6998 11.2123 11.2123C11.6998 10.7248 12.0865 10.146 12.3504 9.50909C12.6142 8.87213 12.75 8.18944 12.75 7.5C12.75 6.81056 12.6142 6.12787 12.3504 5.49091C12.0865 4.85395 11.6998 4.2752 11.2123 3.78769C10.7248 3.30018 10.146 2.91347 9.50909 2.64963C8.87213 2.3858 8.18944 2.25 7.5 2.25C6.81056 2.25 6.12787 2.3858 5.49091 2.64963C4.85395 2.91347 4.2752 3.30018 3.78769 3.78769C3.30018 4.2752 2.91347 4.85395 2.64963 5.49091C2.3858 6.12787 2.25 6.81056 2.25 7.5Z"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.75 15.75L11.25 11.25"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_905_15769">
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function FullScreenSVG() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth={1.5}
    >
      <g clipPath="url(#clip0_905_15763)">
        <path
          d="M3.33325 6.66668V5.00001C3.33325 4.55798 3.50885 4.13406 3.82141 3.8215C4.13397 3.50894 4.55789 3.33334 4.99992 3.33334H6.66659"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.33325 13.3333V15C3.33325 15.442 3.50885 15.866 3.82141 16.1785C4.13397 16.4911 4.55789 16.6667 4.99992 16.6667H6.66659"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.3333 3.33334H14.9999C15.4419 3.33334 15.8659 3.50894 16.1784 3.8215C16.491 4.13406 16.6666 4.55798 16.6666 5.00001V6.66668"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.3333 16.6667H14.9999C15.4419 16.6667 15.8659 16.4911 16.1784 16.1785C16.491 15.866 16.6666 15.442 16.6666 15V13.3333"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_905_15763">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function ClearSVG() {
  return (
    <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1545_1134)">
        <path
          d="M13.4072 10.6882C13.9751 9.56054 14.172 8.28312 13.9697 7.03754C13.7675 5.79196 13.1766 4.64164 12.2808 3.75013C11.3851 2.85861 10.2303 2.27129 8.98048 2.07166C7.73068 1.87204 6.44956 2.07028 5.31928 2.63819M3.7671 3.75952C2.63879 4.88519 2.00527 6.41157 2.0059 8.00288C2.00652 9.59419 2.64125 11.1201 3.77044 12.2449C4.89964 13.3696 6.4308 14.0012 8.02709 14.0006C9.62339 13.9999 11.1541 13.3672 12.2824 12.2415"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.00626 2L14.0439 14"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_1545_1134">
          <rect width="16.0501" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
export {
  IconChevronLeft,
  IconChevronRight,
  DataSetSVG,
  HomeSVG,
  PlusSVG,
  StackSVG,
  BarsSVG,
  EyeSVG,
  SortSVG,
  SearchSVG,
  FullScreenSVG,
  ClearSVG
};
