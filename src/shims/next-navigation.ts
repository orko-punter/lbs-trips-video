const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };
export const useRouter = () => router;
export const usePathname = () => "/organise/planner/demo/guided";
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});
export function redirect(): never {
  throw new Error("redirect is not available in the film");
}
export const notFound = redirect;
export const forbidden = redirect;
