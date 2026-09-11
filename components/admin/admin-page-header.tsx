type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function AdminPageHeader({ eyebrow = "Administration", title, description }: AdminPageHeaderProps) {
  return (
    <header>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{description}</p>
    </header>
  );
}
