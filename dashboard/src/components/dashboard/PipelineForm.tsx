import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function PipelineForm() {
    const [thesis, setThesis] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!thesis.trim() || !email.trim()) {
            toast({
                title: 'Missing fields',
                description: 'Please provide both a thesis and your email address.',
                variant: 'destructive',
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: 'Invalid email',
                description: 'Please enter a valid email address.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        // Call actual backend API
        try {
            const response = await fetch('/generate-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: thesis,
                    email: email,
                }),
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            toast({
                title: 'Pipeline submitted!',
                description: `We'll notify you at ${email} when your dashboard is ready.`,
            });
            setIsSubmitted(true);
        } catch (error) {
            toast({
                title: 'Submission failed',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setThesis('');
        setEmail('');
        setIsSubmitted(false);
    };

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto"
            >
                <div className="bg-card rounded-xl border border-border p-8 lg:p-12 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                    </motion.div>
                    <h2 className="text-xl font-display font-bold text-foreground mb-2">Pipeline Submitted Successfully</h2>
                    <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                        Our data engine is processing your thesis. We'll send a notification to <span className="font-medium text-foreground">{email}</span> when your custom dashboard is ready.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4 text-left mb-6 max-h-40 overflow-y-auto">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Submitted Thesis</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{thesis}</p>
                    </div>
                    <Button onClick={handleReset} variant="outline" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Submit Another Thesis
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto"
        >
            <div className="mb-6">
                <h2 className="text-xl font-display font-bold text-foreground">New Pipeline Request</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Submit your acquisition thesis below. Our data engine will identify matching companies and build a custom dashboard for you.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Thesis Input */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div>
                            <Label htmlFor="thesis" className="text-sm font-semibold text-foreground">
                                Target Thesis
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Describe your acquisition criteria, target services, geography, and exclusions.
                            </p>
                        </div>
                    </div>
                    <Textarea
                        id="thesis"
                        value={thesis}
                        onChange={(e) => setThesis(e.target.value)}
                        placeholder={`Example:\n\nTarget Thesis: Specialty Tax Advisory Services\n\nOur PE client has acquired a specialty tax consulting platform and is looking to build a holistic specialty tax advisory firm through add-on acquisitions.\n\nThe thesis is to find privately held specialty tax firms across the Continental US that provide one or more of the following services:\n• R&D Tax Credits\n• Cost Segregation\n• Work Opportunity Tax Credits (WOTC)\n• Sales & Use Tax consulting\n\nSize threshold: Estimated revenue greater than $3M or employee count greater than 5.\nGeography: Continental United States.\nOwnership: Privately held.`}
                        className="min-h-[280px] text-sm leading-relaxed resize-y font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                        {thesis.length > 0 ? `${thesis.length} characters` : 'Paste or type your thesis'}
                    </p>
                </div>

                {/* Email & Submit */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                                Notification Email
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                We'll notify you when your custom dashboard is ready.
                            </p>
                        </div>
                    </div>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="analyst@firmname.com"
                        className="max-w-md"
                    />
                </div>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !thesis.trim() || !email.trim()}
                        className="gap-2 gradient-primary text-primary-foreground hover:opacity-90 transition-opacity px-6"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Submit Pipeline Request
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </motion.div>
    );
}
