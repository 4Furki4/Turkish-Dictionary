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
  Dropdown,
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
} from "@nextui-org/react";
import { HomeIcon, GithubIcon, Sun, Moon } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import NextLink from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next-intl/client";
import { onEnterAndSpace } from "@/lib/keyEvents";

export default function Navbar() {
  const { status, data } = useSession();
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathName = usePathname();
  const route = useRouter();
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
          <Link as={NextLink} href="/">
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
      <NavbarContent justify="end">
        {isMounted && (
          <NavbarItem>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={32} /> : <Moon size={32} />}
            </button>
          </NavbarItem>
        )}
        <NavbarContent justify="center">
          {status !== "authenticated" ? (
            <NavbarItem>
              <Button
                onKeyDown={(e) =>
                  onEnterAndSpace(e, async () => await signIn())
                }
                onClick={() => signIn()}
                variant="ghost"
                color="primary"
                isLoading={status === "loading"}
              >
                Sign In
              </Button>
            </NavbarItem>
          ) : (
            <NavbarItem className="cursor-pointer">
              <Dropdown>
                <DropdownTrigger>
                  <button>
                    <Avatar
                      showFallback
                      src="https://images.unsplash.com/broken"
                      size="sm"
                    />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  onAction={(key) => {
                    switch (key) {
                      case "saved-words":
                        route.push("/saved-words");
                        break;
                      case "settings":
                        route.push("/settings");
                        break;
                      case "sign-out":
                        signOut();
                        break;
                    }
                  }}
                >
                  <DropdownItem key={"saved-words"} className="text-center">
                    <Link className="w-full" href="/saved-words">
                      Saved Words
                    </Link>
                  </DropdownItem>
                  <DropdownItem key={"settings"}>
                    <Link className="w-full" href="/settings">
                      Settings
                    </Link>
                  </DropdownItem>
                  <DropdownItem
                    className="text-danger"
                    key={"sign-out"}
                    color="danger"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          )}
        </NavbarContent>
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
