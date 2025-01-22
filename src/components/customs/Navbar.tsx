
import {
  Navbar as NextuiNavbar,
  NavbarContent,
  NavbarItem,
  Button,
  Avatar,
  Link,
  Dropdown,
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
  NavbarBrand,
} from "@heroui/react";
import { Book, Languages, Menu, Palette } from "lucide-react";
import { signIn, signOut, } from "next-auth/react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { usePathname, Link as NextIntlLink } from "@/src/i18n/routing";
import { Session } from "next-auth";
import { useCallback } from "react";

type NavbarProps = {
  session: Session | null;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
} & Record<"WordListIntl" | "SignInIntl" | "HomeIntl", string>;

export default function Navbar({
  session,
  WordListIntl,
  SignInIntl,
  HomeIntl,
  setIsSidebarOpen
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const params = useParams();
  const isAuthPage = ["/signup", "/signin", "/forgot-password"].includes(
    pathName
  );
  const getDynamicPathnames = useCallback((path: typeof pathName) => {
    if (path === "/search/[word]") {
      return `/search/${params.word}`;
    }
    if (path === "/reset-password/[token]") {
      return `/reset-password/${params.token}`;
    }
    return path;
  }, [pathName, params.token, params.word])
  return (
    <NextuiNavbar
      className="bg-background-foreground/100 border-b border-border"
      shouldHideOnScroll
      maxWidth="xl"
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
        // wrapper: ["sm:px-0"]
      }}
    >
      <NavbarContent justify="center">
        <NavbarBrand>
          <NextIntlLink as={Link as any} href="/" className="hidden sm:flex items-center gap-2">
            <Book className="h-6 w-6" />
            <span className="text-fs-1 font-bold">Turkish Dictionary</span>
          </NextIntlLink>
          <button className="sm:hidden">
            <Menu aria-label="menu icon" className="h-7 w-7" onClick={() => setIsSidebarOpen(true)} />
          </button>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent justify="end" className="gap-4 sm:gap-8">
        {session?.user.role === "admin" ? (
          <NavbarItem className="hidden sm:flex">
            <NextIntlLink href={"/dashboard"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm'>
              <span className={`text-nowrap`}>Dashboard</span>
            </NextIntlLink>
          </NavbarItem>
        ) : null}
        <NavbarItem>
          <Dropdown classNames={{
            content: ["rounded-sm"],
          }}>
            <DropdownTrigger>
              <button className="bg-transparent flex items-center gap-2 rounded-sm">
                <Languages aria-label="languages icon" className="w-6 h-6" /> {locale.toUpperCase()}
              </button>
            </DropdownTrigger>
            <DropdownMenu>
              {locale === "en" ? (
                <DropdownItem color="primary" key={"tr"} className="rounded-sm">
                  <NextIntlLink
                    className="w-full block"
                    // @ts-ignore
                    href={{
                      pathname: pathName,
                      query: searchParams.toString(),
                      params: {
                        token: params.token as any,
                        word: params.word as any,
                      },
                    }}
                    locale="tr"
                  >
                    Türkçe
                  </NextIntlLink>
                </DropdownItem>
              ) : (
                <DropdownItem color="primary" key={"en"} className="rounded-sm">
                  <NextIntlLink
                    className="w-full block"
                    // @ts-ignore
                    href={{
                      pathname: pathName,
                      query: searchParams.toString(),
                      params: {
                        token: params.token as any,
                        word: params.word as any,
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
        <NavbarItem>
          <Dropdown classNames={{
            content: ["rounded-sm"],
          }}>
            <DropdownTrigger className="cursor-pointer">
              <button className="bg-transparent flex items-center gap-2 rounded-sm">
                <Palette aria-label="palette icon" className="h-7 w-7" />
              </button>
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
              <DropdownItem className="rounded-sm" key={"dark-purple"}>Dark Purple</DropdownItem>
              <DropdownItem className="rounded-sm" key={"light-purple"}>Light Purple</DropdownItem>
              <DropdownItem className="rounded-sm" key={"dark"}>Dark</DropdownItem>
              <DropdownItem className="rounded-sm" key={"light"}>Light</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
        {!session?.user ? (
          <NavbarItem>
            <Button onPress={() => {
              signIn()
            }}>
              {SignInIntl}
            </Button>
            {/* <NextIntlLink
              className="w-full block"
              // @ts-ignore
              href={{
                pathname: '/signin',
                query: { callbackUrl: decodeURI(`${getDynamicPathnames(pathName)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`) },
                search: pathName === "/signin" ? searchParams.toString() : undefined,
              }}
            ><Button
              aria-disabled={isAuthPage}
              isDisabled={isAuthPage}
              variant="ghost"
              color="primary"
              className="rounded-sm"
            >
                {SignInIntl}
              </Button>
            </NextIntlLink> */}
          </NavbarItem>
        ) : (
          <>
            <NavbarItem className="cursor-pointer">
              <Dropdown classNames={{
                content: ["rounded-sm"],
              }}>
                <DropdownTrigger>
                  <button className="rounded-sm">
                    <Avatar
                      showFallback
                      src={session.user.image ?? "https://images.unsplash.com/broken"}
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
                  <DropdownItem color="primary" key={"saved-words"} className="text-center rounded-sm">
                    <Link color="foreground" as={NextIntlLink} className="w-full" href="/saved-words">
                      Saved Words
                    </Link>
                  </DropdownItem>
                  <DropdownItem color="primary" key={"search-history"} className="text-center rounded-sm">
                    <Link color="foreground" as={NextIntlLink} className="w-full" href="/search-history">
                      Search History
                    </Link>
                  </DropdownItem>
                  <DropdownItem color="primary" key={"profile"} className="rounded-sm">
                    <Link color="foreground" as={NextIntlLink} className="w-full" href="/profile">
                      Profile
                    </Link>
                  </DropdownItem>
                  <DropdownItem
                    className="text-danger rounded-sm"
                    key={"sign-out"}
                    color="danger"
                    onPress={() => signOut()}
                  >
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </NextuiNavbar>
  );
}