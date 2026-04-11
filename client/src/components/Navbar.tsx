import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "../assets/logo.webp";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [isRickHovered, setIsRickHovered] = useState(false);
  const [isMyPageHovered, setIsMyPageHovered] = useState(false);

  const { isAuthenticated, logout, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setScrolled(currentScrollY > 50);

      if (currentScrollY <= 20) {
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const dropdownItems = ["드럼", "피아노", "베이스", "기타"];
  const myPageItems = ["계정정보", "내활동", "알림", "설정"];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMyPageItemClick = (item: string) => {
    if (item === "계정정보") navigate("/mypage#account");
    else if (item === "내활동") navigate("/mypage#activity");
    else if (item === "알림") navigate("/mypage#notifications");
    else if (item === "설정") navigate("/mypage#settings");
    else navigate("/mypage");
  };

  const getCategoryPath = (category: string) => {
    switch (category) {
      case "드럼":
        return "/drums";
      case "피아노":
        return "/piano";
      case "베이스":
        return "/bass";
      case "기타":
        return "/guitar";
      default:
        return "/";
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: isNavbarVisible ? 0 : -120 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/90 backdrop-blur-md py-4 border-b border-white/10"
          : "bg-gradient-to-b from-black/80 to-transparent py-6"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <img
            src={logoImg}
            alt="Logo"
            className="h-22 w-auto object-contain"
          />
        </Link>

        <nav className="flex items-center gap-8">
          <div
            className="relative"
            onMouseEnter={() => setIsRickHovered(true)}
            onMouseLeave={() => setIsRickHovered(false)}
          >
            <Link
              href="/drums"
              className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
            >
              릭
            </Link>

            <AnimatePresence>
              {isRickHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-32 bg-card border border-white/10 rounded-md overflow-hidden shadow-xl"
                >
                  {dropdownItems.map((item) => (
                    <Link
                      key={item}
                      href={getCategoryPath(item)}
                      className="block px-4 py-3 text-xs font-bold hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                    >
                      {item}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isAuthenticated ? (
            <>
              {user?.role === "admin" && (
                <>
                  <Link
                    href="/admin"
                    className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
                  >
                    관리자
                  </Link>
                  <Link
                    href="/settlements"
                    className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
                  >
                    정산메뉴
                  </Link>
                </>
              )}

              {user?.role === "musician" && (
                <>
                  <Link
                    href="/musician-profile"
                    className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
                  >
                    프로필
                  </Link>
                  <Link
                    href="/settlements"
                    className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
                  >
                    정산메뉴
                  </Link>
                </>
              )}

              <div
                className="relative"
                onMouseEnter={() => setIsMyPageHovered(true)}
                onMouseLeave={() => setIsMyPageHovered(false)}
              >
                <Link
                  href="/mypage"
                  className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
                >
                  마이페이지
                </Link>

                <AnimatePresence>
                  {isMyPageHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-40 bg-card border border-white/10 rounded-md overflow-hidden shadow-xl"
                    >
                      {[...myPageItems, "로그아웃"].map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            if (item === "로그아웃") {
                              handleLogout();
                            } else {
                              handleMyPageItemClick(item);
                            }
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                        >
                          {item}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/"
                className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
              >
                홈
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
              >
                로그인
              </Link>

              <Link
                href="/signup"
                className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
              >
                회원가입
              </Link>

              <Link
                href="/"
                className="text-base font-semibold tracking-wide hover:text-primary transition-colors uppercase"
              >
                홈
              </Link>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
}