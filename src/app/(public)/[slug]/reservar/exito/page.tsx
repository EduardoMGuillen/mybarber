import { ReservaExitoClient } from "@/components/booking/reserva-exito-client";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function ReservaExitoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { id } = await searchParams;

  return <ReservaExitoClient slug={slug} appointmentId={id} />;
}
