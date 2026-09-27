export interface Course {
	course_id: string;
	course_name: string;
	course_type: string;
	course_date: string;
	course_description?: string;
	course_lecture: string;
	course_location?: string;
	course_img?: string;
	course_team: string;
	is_visible: string | number;
	is_submissionproject?: boolean | string;
	pastevent?: boolean | string;
	is_personalcomputer?: boolean | string;
	location_seats?: number | string;
}

export type CourseStatus = 'open' | 'closed' | 'ended' | 'draft';

// The list endpoint sends real booleans, the single-course endpoint sends 'True' / 'False'.
export function flag(value: unknown): boolean {
	if (typeof value === 'string') return ['true', '1'].includes(value.trim().toLowerCase());
	return value === true || value === 1;
}

// 'YYYY-MM-DD' parsed as a local date, so the day never shifts with the timezone.
export function parseCourseDate(courseDate: string | undefined | null): Date | null {
	const [year, month, day] = (courseDate ?? '').split('T')[0].split('-').map(Number);
	if (!year || !month || !day) return null;
	return new Date(year, month - 1, day);
}

// A date counts as past only once its whole day has ended, in local time.
export function isPastDate(courseDate: string | undefined | null): boolean {
	const date = parseCourseDate(courseDate);
	if (!date) return false;
	date.setHours(23, 59, 59, 999);
	return date.getTime() < Date.now();
}

// A course is past when staff flagged it, or once its scheduled day has ended.
export const isPastCourse = (course: Course): boolean =>
	flag(course.pastevent) || isPastDate(course.course_date);

export function courseStatus(course: Course): CourseStatus {
	const visible = String(course.is_visible);
	if (visible === '0') return 'draft';
	if (isPastCourse(course)) return 'ended';
	return visible === '1' ? 'open' : 'closed';
}

export function formatCourseDate(
	courseDate: string,
	options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
	const date = parseCourseDate(courseDate);
	return date ? date.toLocaleDateString('en-GB', options) : courseDate;
}

export function dateParts(courseDate: string) {
	const date = parseCourseDate(courseDate);
	if (!date) return null;
	return {
		day: date.getDate(),
		month: date.toLocaleDateString('en-US', { month: 'short' }),
		year: date.getFullYear(),
		weekday: date.toLocaleDateString('en-GB', { weekday: 'long' })
	};
}

export const seats = (course: Course): number => Number(course.location_seats) || 0;
