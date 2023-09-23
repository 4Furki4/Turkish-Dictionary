"use client";
import {
  Navbar as NextuiNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Avatar,
  Link,
} from "@nextui-org/react";
import { HomeIcon, GithubIcon, Sun, Moon } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { status, data } = useSession();
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathName = usePathname();
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <NextuiNavbar
      shouldHideOnScroll
      classNames={{
        item: [
          "relative",
          "flex",
          "h-full",
          "items-center",
          "data-[active=true]",
          "data-[active=true]:after:content-['']",
          "data-[active=true]:after:absolute",
          "data-[active=true]:after:bottom-0",
          "data-[active=true]:after:left-0",
          "data-[active=true]:after:right-0",
          "data-[active=true]:after:h-[2px]",
          "data-[active=true]:after:rounded-[2px]",
          "data-[active=true]:after:bg-primary",
        ],
      }}
    >
      <NavbarMenuToggle
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        className="sm:hidden"
      />
      <NavbarContent className="hidden sm:flex" justify="start">
        <NavbarItem>
          <Link href="/">
            <HomeIcon size={32} />
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent className="hidden sm:flex" justify="center">
        <NavbarItem>
          <Link href={"/word-list"}>Word List</Link>
        </NavbarItem>
        <NavbarItem isActive={pathName.includes("/protected")}>
          <Link href={"/protected"}>Protected Page</Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent className="hidden sm:flex" justify="end">
        <NavbarItem>
          <Link
            href={"https://github.com/4Furki4/Turkish-Dictionary"}
            target="_blank"
          >
            <GithubIcon size={32} />
          </Link>
        </NavbarItem>
        {isMounted && (
          <NavbarItem
            className="cursor-pointer"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setTheme(theme === "dark" ? "light" : "dark");
              }
            }}
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
            }}
          >
            {theme === "dark" ? <Sun size={32} /> : <Moon size={32} />}
          </NavbarItem>
        )}
        <NavbarContent className="hidden sm:flex" justify="center">
          {status !== "authenticated" ? (
            <NavbarItem>
              <Button
                onClick={() => signIn()}
                variant="ghost"
                color="primary"
                isLoading={status === "loading"}
              >
                Sign In
              </Button>
            </NavbarItem>
          ) : (
            <NavbarItem>
              <Avatar
                showFallback
                src="https://images.unsplash.com/broken"
                size="sm"
              />
            </NavbarItem>
          )}
        </NavbarContent>
      </NavbarContent>
      <NavbarContent className="sm:hidden" justify="end">
        {status !== "authenticated" ? (
          <NavbarItem>
            <Button
              onClick={() => signIn()}
              variant="ghost"
              color="primary"
              isLoading={status === "loading"}
            >
              Sign In
            </Button>
          </NavbarItem>
        ) : (
          <NavbarItem className="cursor-pointer p-3 hover:bg-secondary rounded-full transition-background">
            <Avatar
              showFallback
              src="https://images.unsplash.com/broken"
              size="sm"
            />
          </NavbarItem>
        )}
      </NavbarContent>
      <NavbarMenu>
        <NavbarMenuItem>
          <Link href={"/"}>Home</Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link href={"/word-list"}>Word List</Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link href={"/protected"}>Protected Page</Link>
        </NavbarMenuItem>
      </NavbarMenu>
    </NextuiNavbar>
  );
}
