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
    <svg width="25" height="25" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.33325 5C3.33325 5.66304 4.03563 6.29893 5.28587 6.76777C6.53612 7.23661 8.23181 7.5 9.99992 7.5C11.768 7.5 13.4637 7.23661 14.714 6.76777C15.9642 6.29893 16.6666 5.66304 16.6666 5C16.6666 4.33696 15.9642 3.70107 14.714 3.23223C13.4637 2.76339 11.768 2.5 9.99992 2.5C8.23181 2.5 6.53612 2.76339 5.28587 3.23223C4.03563 3.70107 3.33325 4.33696 3.33325 5Z"
        stroke="#212529"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.33325 5V10C3.33325 10.663 4.03563 11.2989 5.28587 11.7678C6.53612 12.2366 8.23181 12.5 9.99992 12.5C11.768 12.5 13.4637 12.2366 14.714 11.7678C15.9642 11.2989 16.6666 10.663 16.6666 10V5"
        stroke="#212529"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.33325 10V15C3.33325 15.663 4.03563 16.2989 5.28587 16.7678C6.53612 17.2366 8.23181 17.5 9.99992 17.5C11.768 17.5 13.4637 17.2366 14.714 16.7678C15.9642 16.2989 16.6666 15.663 16.6666 15V10"
        stroke="#212529"
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
  return (
    <svg width="35" height="37" viewBox="0 0 26 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="12" r="12" fill="#868E96" />
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

export {IconChevronLeft, IconChevronRight, DataSetSVG, HomeSVG, PlusSVG, StackSVG, BarsSVG};
