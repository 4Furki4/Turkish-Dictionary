"use client";
import {
  Navbar as NextuiNavbar,
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
import { HomeIcon, Palette } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import NextLink from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { onEnterAndSpace } from "@/src/lib/keyEvents";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { usePathname, useRouter, Link as NextIntlLink } from "@/src/navigation";
import { Session } from "next-auth";

export default function Navbar({
  session,
  WordListIntl,
  SignInIntl,
  HomeIntl,
}: {
  session: Session | null;
  WordListIntl: string;
  SignInIntl: string;
  HomeIntl: string;
}) {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const route = useRouter();
  const locale = useLocale();
  const params = useParams();
  const isAuthPage = ["/signup", "/signin", "/forgot-password"].includes(
    pathName
  );
  return (
    <NextuiNavbar
      className="bg-content1"
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
        // wrapper: ["max-w-7xl"],
      }}
    >
      <NavbarMenuToggle
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        className="sm:hidden"
      />
      <NavbarContent className="hidden sm:flex" justify="start">
        <NavbarItem>
          <Link as={NextLink} href="/">
            <HomeIcon aria-label="Home Icon" size={32} />
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent className="hidden sm:flex" justify="center">
        <NavbarItem isActive={pathName.includes("/word-list")}>
          <Link as={NextLink} href={"/word-list"}>
            {WordListIntl}
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="light" color="primary">
                {locale === "en" ? "English" : "Turkish"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) => {
                const queryParams = new URLSearchParams(searchParams);
                switch (key) {
                  case "tr":
                    route.push({
                      pathname: pathName,
                      query: queryParams as any,
                      params: {
                        token: params.token as any,
                      },
                    });
                    break;
                  case "en":
                    route.push({
                      pathname: pathName,
                      query: queryParams as any,
                      params: {
                        token: params.token as any,
                      },
                    });
                    break;
                }
              }}
            >
              {locale === "en" ? (
                <DropdownItem color="primary" key={"tr"}>
                  <NextIntlLink
                    className="w-full block"
                    href={{
                      pathname: pathName,
                      query: new URLSearchParams(searchParams) as any,
                      params: {
                        token: params.token as any,
                      },
                    }}
                    locale="tr"
                  >
                    Türkçe
                  </NextIntlLink>
                </DropdownItem>
              ) : (
                <DropdownItem color="primary" key={"en"}>
                  <NextIntlLink
                    className="w-full block"
                    href={{
                      pathname: pathName,
                      query: new URLSearchParams(searchParams) as any,
                      params: {
                        token: params.token as any,
                      },
                    }}
                    locale="en"
                  >
                    English
                  </NextIntlLink>
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
        {!session?.user ? (
          <NavbarItem>
            <Button
              aria-disabled={isAuthPage}
              isDisabled={isAuthPage}
              onKeyDown={(e) =>
                onEnterAndSpace(e, () => {
                  if (!isAuthPage) signIn();
                })
              }
              onClick={() => {
                if (!isAuthPage) signIn();
              }}
              variant="ghost"
              color="primary"
            >
              {SignInIntl}
            </Button>
          </NavbarItem>
        ) : (
          <>
            {session?.user.role === "user" ? null : (
              <NavbarItem className="hidden sm:flex">
                <Link as={NextLink} href={"/dashboard"}>
                  Dashboard
                </Link>
              </NavbarItem>
            )}
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
                      case "sign-out":
                        signOut();
                        break;
                    }
                  }}
                >
                  <DropdownItem key={"saved-words"} className="text-center">
                    <Link as={NextLink} className="w-full" href="/saved-words">
                      Saved Words
                    </Link>
                  </DropdownItem>
                  <DropdownItem key={"profile"}>
                    <Link as={NextLink} className="w-full" href="/profile">
                      Profile
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
          </>
        )}
        <NavbarItem>
          <Dropdown>
            <DropdownTrigger className="cursor-pointer">
              <Button className="bg-transparent" variant="flat">
                <Palette aria-label="palette icon" size={32} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              color="primary"
              disabledKeys={[theme!]}
              onAction={(key) => {
                switch (key) {
                  case "dark-purple":
                    setTheme("dark-purple");
                    break;
                  case "light-purple":
                    setTheme("light-purple");
                    break;
                  case "dark":
                    setTheme("dark");
                    break;
                  case "light":
                    setTheme("light");
                    break;
                }
              }}
            >
              <DropdownItem key={"dark-purple"}>Dark Purple</DropdownItem>
              <DropdownItem key={"light-purple"}>Light Purple</DropdownItem>
              <DropdownItem key={"dark"}>Dark</DropdownItem>
              <DropdownItem key={"light"}>Light</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu className="bg-content1 sm:hidden">
        <NavbarMenuItem>
          <Link
            as={NextLink}
            href={"/"}
            className={pathName === "/" ? "underline" : ""}
          >
            {HomeIntl}
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link
            as={NextLink}
            href={"/word-list"}
            className={pathName.includes("word-list") ? "underline" : ""}
          >
            {WordListIntl}
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link
            as={NextLink}
            className={pathName.includes("dashboard") ? "underline" : ""}
            href="/dashboard"
          >
            Dashboard
          </Link>
        </NavbarMenuItem>
      </NavbarMenu>
    </NextuiNavbar>
  );
}
