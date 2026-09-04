import { Redirect } from 'expo-router';

/** The Log tab position is a raised action (UX-DEC-01); it has no screen of its
 *  own. If routing ever lands here, bounce to the Log sheet. */
export default function LogPlaceholder() {
  return <Redirect href="/log" />;
}
