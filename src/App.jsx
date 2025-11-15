import React from "react";
import Carousel from "./components/Carousel";

const images = [
  { src: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=1200&q=80", alt: "Mountains" },
  { src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80", alt: "Beach" },
  { src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80", alt: "Forest" }
];

export default function App() {
  return (
    <div style={{ maxWidth: 800, margin: "30px auto", padding: "0 16px" }}>
      <h1 style={{ textAlign: "center" }}>My Simple Carousel</h1>
      <Carousel images={images} autoPlayInterval={4000} />
    </div>
  );
}
