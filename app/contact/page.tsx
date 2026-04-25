import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MessageSquare, MapPin, Globe } from 'lucide-react'

export default function ContactUs() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h1 className="text-5xl font-black mb-6 tracking-tight">GET IN TOUCH</h1>
              <p className="text-xl text-muted-foreground mb-12">
                Have questions about our AI predictions or need technical support? We're here to help.
              </p>

              <div className="space-y-8">
                <ContactItem 
                  icon={<Mail className="h-6 w-6 text-accent" />}
                  title="Email Us"
                  content="support@o2-5predictions.com"
                />
                <ContactItem 
                  icon={<MessageSquare className="h-6 w-6 text-accent" />}
                  title="Live Support"
                  content="Available Monday to Friday, 9am - 6pm EST"
                />
                <ContactItem 
                  icon={<MapPin className="h-6 w-6 text-accent" />}
                  title="Office"
                  content="Innovation Hub, Tech District, New York, NY"
                />
                <ContactItem 
                  icon={<Globe className="h-6 w-6 text-accent" />}
                  title="Socials"
                  content="@O25Predictions"
                />
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card border border-border p-8 rounded-2xl shadow-xl">
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <Input placeholder="John Doe" className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <Input placeholder="john@example.com" type="email" className="bg-background border-border" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                  <Input placeholder="Algorithm Question" className="bg-background border-border" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
                  <Textarea placeholder="How can we help you?" className="bg-background border-border min-h-[150px]" />
                </div>

                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold uppercase">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function ContactItem({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 mt-1">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{content}</p>
      </div>
    </div>
  )
}
