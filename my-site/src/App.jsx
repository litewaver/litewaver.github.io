import Navbar from "./components/Navbar";
import SocialLinks from "./components/SocialLinks";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <section
          id="home"
          className="flex min-h-screen flex-col items-center justify-center text-white"
        >
          <h1 className="text-3xl">Victoria Joseph | Full Stack Developer</h1>
        </section>
        <SocialLinks />
        <Footer/>
      </main>
    </>
  );
}