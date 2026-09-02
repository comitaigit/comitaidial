import type { QueueItem } from "@/features/dialer/data/dialer-api";

function ContactQueueRow({
  contact,
  position,
  onRemove,
}: {
  contact: QueueItem;
  position: number;
  onRemove: (personId: string) => void;
}) {
  return (
    <div
      className="grid items-center py-2 hover:bg-[#FAFAFA]"
      style={{ gridTemplateColumns: "24px 1fr auto", gap: "0 14px" }}
    >
      <span className="text-[11px] text-[#CBD5E1]">{position}</span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-[600] text-[#0F172A]">{contact.name}</p>
        <p className="truncate text-[12px] text-[#64748B]">{contact.accountName}</p>
        {contact.role && (
          <p className="truncate text-[12px] text-[#94A3B8]">{contact.role}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(contact.personId)}
        className="shrink-0 text-[11px] font-[600] text-[#94A3B8] transition-colors hover:text-[#DC2626]"
      >
        Remover
      </button>
    </div>
  );
}

export function ContactQueue({
  contacts,
  onRemove,
}: {
  contacts: QueueItem[];
  onRemove: (personId: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-[700] uppercase tracking-[1px] text-[#CBD5E1]">
          Fila de contatos
        </span>
        {contacts.length > 0 && (
          <span className="text-[11px] text-[#94A3B8]">{contacts.length} aguardando</span>
        )}
      </div>
      {contacts.length === 0 ? (
        <p className="text-[12px] text-[#94A3B8]">Nenhum contato na fila.</p>
      ) : (
        <div className="flex flex-col divide-y divide-[#F8FAFC]">
          {contacts.map((contact, index) => (
            <ContactQueueRow
              key={contact.personId}
              contact={contact}
              position={index + 1}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
